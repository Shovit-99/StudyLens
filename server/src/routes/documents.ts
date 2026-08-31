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
      const page = await prisma.documentPage.create({
        data: {
          documentId: document.id,
          pageNumber: 1, // Treat entire extracted text as one page for now
          content: data.text
        }
      });

      // 4. Chunk the text
      // Split by double newline (paragraphs)
      const rawChunks = data.text.split(/\n\s*\n/);
      let chunksToSave: string[] = [];
      const MAX_CHUNK_LENGTH = 1000;
      
      for (const chunk of rawChunks) {
        const cleanChunk = chunk.trim();
        if (!cleanChunk) continue;
        
        // If chunk is too large, split it further
        if (cleanChunk.length > MAX_CHUNK_LENGTH) {
          const subChunks = cleanChunk.match(new RegExp(`.{1,${MAX_CHUNK_LENGTH}}`, 'gs')) || [];
          chunksToSave.push(...subChunks.map((sc: string) => sc.trim()).filter(Boolean));
        } else {
          chunksToSave.push(cleanChunk);
        }
      }

      // 5. Save chunks to database
      if (chunksToSave.length > 0) {
        const chunkData = chunksToSave.map((content, index) => ({
          pageId: page.id,
          chunkIndex: index,
          content: content
        }));
        await prisma.documentChunk.createMany({
          data: chunkData
        });
      }

      // 6. Update status to COMPLETED
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

// Get a specific document by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        pages: true // Include extracted text pages
      }
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.userId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a document (e.g. rename)
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, subjectId } = req.body;

    const existingDoc = await prisma.document.findUnique({ where: { id } });
    if (!existingDoc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (existingDoc.userId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const updatedDoc = await prisma.document.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingDoc.title,
        subjectId: subjectId !== undefined ? subjectId : existingDoc.subjectId
      }
    });

    res.json(updatedDoc);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a document
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (document.userId !== req.user!.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Delete file from disk
    if (document.file_path && fs.existsSync(document.file_path)) {
      try {
        fs.unlinkSync(document.file_path);
      } catch (fsError) {
        console.error('Error deleting file from disk:', fsError);
      }
    }

    // Delete from database (pages will cascade delete per schema)
    await prisma.document.delete({ where: { id } });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
