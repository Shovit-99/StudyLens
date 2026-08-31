import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

router.use(auth);

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
            userId: req.user!.id // Ensure they only search their own documents
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
