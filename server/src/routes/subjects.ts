import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

// Middleware to protect these routes
router.use(auth);

// Get all subjects for logged-in user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new subject
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Name is required' });
      return;
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        userId: req.user!.id
      }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
