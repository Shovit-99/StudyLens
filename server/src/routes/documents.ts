// @ts-nocheck
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const pdfParse = require('pdf-parse'); // standard version 1.1.1
const { parseOffice } = require('officeparser');
import prisma from '../prisma';
import { auth } from '../middleware/auth';
import { generateEmbeddings } from '../utils/embeddings';
import { uploadLimiter } from '../middleware/rateLimiter';

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
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and PPTX files are allowed'));
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
        userId: (req as any).user!.id,
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
router.post('/', uploadLimiter, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
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
        userId: (req as any).user!.id,
        subjectId: subjectId || null
      }
    });

    // Send response immediately to avoid upload latency
    res.status(201).json(document);

    // Process file asynchronously in the background
    (async () => {
      try {
      // 2. Parse the file based on type
      let extractedText = '';
      if (file.mimetype === 'application/pdf') {
        const pdfBuffer = fs.readFileSync(file.path);
        const data = await pdfParse(pdfBuffer);
        extractedText = data.text;
      } else {
        // PPTX parsing
        const doc = await parseOffice(file.path);
        extractedText = typeof doc === 'string' ? doc : (doc.toText ? doc.toText() : doc.toString());
      }
      
      // 3. Save extracted text
      const page = await prisma.documentPage.create({
        data: {
          documentId: document.id,
          pageNumber: 1, // Treat entire extracted text as one page for now
          content: extractedText
        }
      });

      // 4. Chunk the text
      // Split by double newline (paragraphs)
      const rawChunks = extractedText.split(/\n\s*\n/);
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

      // 5. Save chunks and generate embeddings
      if (chunksToSave.length > 0) {
        try {
          console.log(`Generating embeddings for ${chunksToSave.length} chunks...`);
          const embeddings = await generateEmbeddings(chunksToSave);
          
          for (let i = 0; i < chunksToSave.length; i++) {
            const content = chunksToSave[i];
            const embedding = embeddings![i];
            
            // Create chunk
            const chunk = await prisma.documentChunk.create({
              data: {
                pageId: page.id,
                chunkIndex: i,
                content: content
              }
            });

            // Update with embedding vector
            const vectorString = `[${embedding.join(',')}]`;
            await prisma.$executeRaw`
              UPDATE "DocumentChunk" 
              SET embedding = ${vectorString}::vector
              WHERE id = ${chunk.id}
            `;
          }
        } catch (embedError) {
          console.warn('Failed to generate or store embeddings (pgvector might be down):', embedError);
          // Fallback: Just save chunks without embeddings
          const chunkData = chunksToSave.map((content, index) => ({
            pageId: page.id,
            chunkIndex: index,
            content: content
          }));
          await prisma.documentChunk.createMany({
            data: chunkData
          });
        }
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
    })(); // End of background processing

  } catch (error: any) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// Get document upload stats for the last 7 days
router.get('/stats/weekly', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user!.id;
    
    // Total documents processed by this user
    const totalDocuments = await prisma.document.count({
      where: { userId }
    });

    // Last 7 days stats
    const today = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const documents = await prisma.document.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(new Date().setDate(today.getDate() - 7))
        }
      },
      select: { createdAt: true }
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const weeklyData = last7Days.map(date => {
      const dayName = dayNames[date.getDay()];
      // Count documents created on this specific day (ignoring time)
      const count = documents.filter(doc => {
        const docDate = new Date(doc.createdAt);
        return docDate.getDate() === date.getDate() && 
               docDate.getMonth() === date.getMonth() && 
               docDate.getFullYear() === date.getFullYear();
      }).length;
      
      return {
        name: dayName,
        active: count,
        secondary: 0,
        isToday: date.getDate() === today.getDate()
      };
    });

    res.json({
      total: totalDocuments,
      chartData: weeklyData
    });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ message: 'Server error' });
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

    if (document.userId !== (req as any).user!.id) {
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

    if (existingDoc.userId !== (req as any).user!.id) {
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

    if (document.userId !== (req as any).user!.id) {
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
