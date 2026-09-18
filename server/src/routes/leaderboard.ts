import { Router, Request, Response } from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: {
        totalCorrectAnswers: 'desc',
      },
      take: 10,
      select: {
        id: true,
        name: true,
        totalCorrectAnswers: true,
        totalQuizzesTaken: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    res.json(topUsers);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
