// @ts-nocheck
import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

// Middleware to protect these routes
router.use(auth);

// Get all subjects for logged-in user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const isArchived = req.query.archived === 'true';
    const subjects = await prisma.subject.findMany({
      where: { 
        userId: (req as any).user!.id,
        isArchived: isArchived
      },
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
        userId: (req as any).user!.id
      }
    });

    res.status(201).json(subject);
  } catch (error) {
    console.error('Error creating subject:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle archive status
router.patch('/:id/archive', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;
    
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    if (subject.userId !== (req as any).user!.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: { isArchived }
    });
    
    res.json(updatedSubject);
  } catch (error) {
    console.error('Error updating subject archive status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
