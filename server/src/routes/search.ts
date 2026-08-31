// @ts-nocheck
import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { auth } from '../middleware/auth';
import { generateEmbeddings } from '../utils/embeddings';
import { searchLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.use(auth);
router.use(searchLimiter);

// Hybrid search (Keyword + Semantic with RRF)
router.get('/hybrid', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Query parameter "q" is required' });
      return;
    }

    // 1. Fire keyword search
    const keywordPromise = prisma.documentChunk.findMany({
      where: {
        content: { contains: q, mode: 'insensitive' },
        page: { document: { userId: (req as any).user!.id } }
      },
      include: {
        page: {
          include: {
            document: { select: { id: true, title: true, subjectId: true } }
          }
        }
      },
      take: 60 // Fetch more for RRF ranking
    });

    // 2. Fire semantic search
    const semanticPromise = (async () => {
      const embeddings = await generateEmbeddings([q]);
      const vectorString = `[${embeddings[0]!.join(',')}]`;
      const rawResults: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          dc.id, dc."chunkIndex", dc.content,
          dp."pageNumber",
          d.id AS "documentId", d.title AS "documentTitle", d."subjectId",
          1 - (dc.embedding <=> '${vectorString}'::vector) AS similarity
        FROM "DocumentChunk" dc
        JOIN "DocumentPage" dp ON dc."pageId" = dp.id
        JOIN "Document" d ON dp."documentId" = d.id
        WHERE d."userId" = $1
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> '${vectorString}'::vector
        LIMIT 60;
      `, (req as any).user!.id);
      
      return rawResults.map(row => ({
        id: row.id,
        content: row.content,
        similarity: row.similarity,
        page: {
          pageNumber: row.pageNumber,
          document: {
            id: row.documentId,
            title: row.documentTitle,
            subjectId: row.subjectId
          }
        }
      }));
    })();

    // Await both searches concurrently
    const [keywordResult, semanticResult] = await Promise.allSettled([keywordPromise, semanticPromise]);

    if (semanticResult.status === 'rejected') {
      console.warn('Semantic portion of hybrid search failed. Falling back to keyword-only:', semanticResult.reason);
    }

    const keywordChunks = keywordResult.status === 'fulfilled' ? keywordResult.value : [];
    const semanticChunks = semanticResult.status === 'fulfilled' ? semanticResult.value : [];

    // Reciprocal Rank Fusion (RRF)
    const rrfScores = new Map<string, { score: number, chunk: any }>();
    const RRF_CONSTANT = 60;

    // Rank keyword chunks
    keywordChunks.forEach((chunk, index) => {
      const rank = index + 1;
      const score = 1 / (RRF_CONSTANT + rank);
      rrfScores.set(chunk.id, { score, chunk });
    });

    // Rank semantic chunks
    semanticChunks.forEach((chunk, index) => {
      const rank = index + 1;
      const score = 1 / (RRF_CONSTANT + rank);
      if (rrfScores.has(chunk.id)) {
        rrfScores.get(chunk.id)!.score += score;
      } else {
        rrfScores.set(chunk.id, { score, chunk });
      }
    });

    // Sort by combined RRF score
    const combinedResults = Array.from(rrfScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 20) // Return top 20
      .map(item => item.chunk);

    // Save search history
    await prisma.searchHistory.create({
      data: { query: q }
    });

    res.json(combinedResults);
  } catch (error) {
    console.error('Error during hybrid search:', error);
    res.status(500).json({ message: 'Server error during hybrid search' });
  }
});

// Semantic search using pgvector
router.get('/semantic', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Query parameter "q" is required' });
      return;
    }

    try {
      // 1. Generate embedding for the query
      const embeddings = await generateEmbeddings([q]);
      const queryVector = embeddings[0]!;
      const vectorString = `[${queryVector.join(',')}]`;

      // 2. Perform vector similarity search
      const results: any[] = await prisma.$queryRawUnsafe(`
        SELECT
          dc.id, dc."chunkIndex", dc.content,
          dp."pageNumber",
          d.id AS "documentId", d.title AS "documentTitle", d."subjectId",
          1 - (dc.embedding <=> '${vectorString}'::vector) AS similarity
        FROM "DocumentChunk" dc
        JOIN "DocumentPage" dp ON dc."pageId" = dp.id
        JOIN "Document" d ON dp."documentId" = d.id
        WHERE d."userId" = $1
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> '${vectorString}'::vector
        LIMIT 20;
      `, (req as any).user!.id);

      // 3. Map to match expected frontend structure
      const mappedResults = results.map(row => ({
        id: row.id,
        content: row.content,
        similarity: row.similarity,
        page: {
          pageNumber: row.pageNumber,
          document: {
            id: row.documentId,
            title: row.documentTitle,
            subjectId: row.subjectId
          }
        }
      }));

      // Save search history
      await prisma.searchHistory.create({
        data: { query: q }
      });

      res.json(mappedResults);
    } catch (pgError: any) {
      console.warn('Semantic search failed, fallback to keyword search:', pgError);
      
      // Fallback: Keyword search
      const fallbackResults = await prisma.documentChunk.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          page: { document: { userId: (req as any).user!.id } }
        },
        include: {
          page: {
            include: {
              document: { select: { id: true, title: true, subjectId: true } }
            }
          }
        },
        take: 20
      });
      
      await prisma.searchHistory.create({
        data: { query: q }
      });

      res.json(fallbackResults);
    }
  } catch (error) {
    console.error('Error during semantic search:', error);
    res.status(500).json({ message: 'Server error during semantic search' });
  }
});

// Search chunks by keyword
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ message: 'Query parameter "q" is required' });
      return;
    }

    // Keyword search using Prisma's "contains" operator
    const results = await prisma.documentChunk.findMany({
      where: {
        content: {
          contains: q,
          mode: 'insensitive' // case-insensitive search (ILIKE in Postgres)
        },
        page: {
          document: {
            userId: (req as any).user!.id // Ensure they only search their own documents
          }
        }
      },
      include: {
        page: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                subjectId: true
              }
            }
          }
        }
      },
      take: 20 // Limit to 20 results for now
    });

    // Save search history
    await prisma.searchHistory.create({
      data: {
        query: q
      }
    });

    res.json(results);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

export default router;
