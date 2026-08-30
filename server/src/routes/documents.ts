import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import prisma from '../prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware to protect these routes
router.use(auth);

// Get all documents for logged-in user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        userId: req.user!.id,
        ...(subjectId ? { subjectId: String(subjectId) } : {})
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload a new document
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, subjectId } = req.body;
    const file = req.file;
    
    if (!title || !file) {
      res.status(400).json({ message: 'Title and file are required' });
      return;
    }

    // 1. Create document with UPLOADED status (or PROCESSING)
    let document = await prisma.document.create({
      data: {
        title,
        filename: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_path: file.path,
        status: 'PROCESSING',
        userId: req.user!.id,
        subjectId: subjectId || null
      }
    });

    try {
      // 2. Parse the PDF
      const pdfBuffer = fs.readFileSync(file.path);
      const data = await pdfParse(pdfBuffer);
      
      // 3. Save extracted text
      await prisma.documentPage.create({
        data: {
          documentId: document.id,
          pageNumber: 1, // Treat entire extracted text as one page for now
          content: data.text
        }
      });

      // 4. Update status to COMPLETED
      document = await prisma.document.update({
        where: { id: document.id },
        data: { status: 'COMPLETED' }
      });
    } catch (parseError) {
      console.error('Error parsing PDF:', parseError);
      document = await prisma.document.update({
        where: { id: document.id },
        data: { status: 'FAILED' }
      });
    }

    res.status(201).json(document);
  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;
