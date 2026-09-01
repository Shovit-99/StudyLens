"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const embeddings_1 = require("../utils/embeddings");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = express_1.default.Router();
router.use(auth_1.auth);
router.use(rateLimiter_1.searchLimiter);
// Hybrid search (Keyword + Semantic with RRF)
router.get('/hybrid', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            res.status(400).json({ message: 'Query parameter "q" is required' });
            return;
        }
        // 1. Fire keyword search
        const keywordPromise = prisma_1.default.documentChunk.findMany({
            where: {
                content: { contains: q, mode: 'insensitive' },
                page: { document: { userId: req.user.id } }
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
            const embeddings = await (0, embeddings_1.generateEmbeddings)([q]);
            const vectorString = `[${embeddings[0].join(',')}]`;
            const rawResults = await prisma_1.default.$queryRawUnsafe(`
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
      `, req.user.id);
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
        const rrfScores = new Map();
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
                rrfScores.get(chunk.id).score += score;
            }
            else {
                rrfScores.set(chunk.id, { score, chunk });
            }
        });
        // Sort by combined RRF score
        const combinedResults = Array.from(rrfScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 20) // Return top 20
            .map(item => item.chunk);
        // Save search history
        await prisma_1.default.searchHistory.create({
            data: { query: q }
        });
        res.json(combinedResults);
    }
    catch (error) {
        console.error('Error during hybrid search:', error);
        res.status(500).json({ message: 'Server error during hybrid search' });
    }
});
// Semantic search using pgvector
router.get('/semantic', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            res.status(400).json({ message: 'Query parameter "q" is required' });
            return;
        }
        try {
            // 1. Generate embedding for the query
            const embeddings = await (0, embeddings_1.generateEmbeddings)([q]);
            const queryVector = embeddings[0];
            const vectorString = `[${queryVector.join(',')}]`;
            // 2. Perform vector similarity search
            const results = await prisma_1.default.$queryRawUnsafe(`
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
      `, req.user.id);
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
            await prisma_1.default.searchHistory.create({
                data: { query: q }
            });
            res.json(mappedResults);
        }
        catch (pgError) {
            console.warn('Semantic search failed, fallback to keyword search:', pgError);
            // Fallback: Keyword search
            const fallbackResults = await prisma_1.default.documentChunk.findMany({
                where: {
                    content: { contains: q, mode: 'insensitive' },
                    page: { document: { userId: req.user.id } }
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
            await prisma_1.default.searchHistory.create({
                data: { query: q }
            });
            res.json(fallbackResults);
        }
    }
    catch (error) {
        console.error('Error during semantic search:', error);
        res.status(500).json({ message: 'Server error during semantic search' });
    }
});
// Search chunks by keyword
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            res.status(400).json({ message: 'Query parameter "q" is required' });
            return;
        }
        // Keyword search using Prisma's "contains" operator
        const results = await prisma_1.default.documentChunk.findMany({
            where: {
                content: {
                    contains: q,
                    mode: 'insensitive' // case-insensitive search (ILIKE in Postgres)
                },
                page: {
                    document: {
                        userId: req.user.id // Ensure they only search their own documents
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
        await prisma_1.default.searchHistory.create({
            data: {
                query: q
            }
        });
        res.json(results);
    }
    catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({ message: 'Server error during search' });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map