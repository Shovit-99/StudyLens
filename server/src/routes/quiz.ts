import express, { Request, Response } from 'express';
import prisma from '../prisma';
import { auth } from '../middleware/auth';
import Groq from 'groq-sdk';

const router = express.Router();

router.use(auth);

router.post('/generate/:documentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;

    // Verify user owns the document
    const document = await prisma.document.findUnique({
      where: { id: documentId as string }
    });

    if (!document) {
      res.status(404).json({ message: 'Document not found.' });
      return;
    }

    if (document.userId !== (req as any).user!.id) {
      res.status(403).json({ message: 'Forbidden.' });
      return;
    }

    // Fetch all chunks for the document to use as context
    const chunks = await prisma.documentChunk.findMany({
      where: {
        page: { documentId: documentId as string }
      },
      take: 20 // Limit to first 20 chunks (~10k chars) to avoid blowing up Groq context window, or taking too long.
    });

    if (!chunks || chunks.length === 0) {
      res.status(400).json({ message: 'No text extracted from this document to generate a quiz.' });
      return;
    }

    const contextText = chunks.map(c => c.content).join('\n\n');

    // Generate Quiz via Groq
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not set.");
    const groq = new Groq({ apiKey: groqApiKey });

    const prompt = `You are an expert teacher. Create a multiple-choice quiz based ONLY on the provided document text. 
Generate exactly 5 questions. The questions should test understanding of key concepts, not just trivial facts.

Document text:
${contextText}

You must return a valid JSON object containing a "questions" array. Each question must follow this exact schema:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2, // The index (0-3) of the correct option
      "explanation": "A short explanation of why this answer is correct based on the text."
    }
  ]
}

Ensure the output is strictly valid JSON and nothing else.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "groq/compound-mini",
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "{}";
    
    let parsedQuiz;
    try {
      parsedQuiz = JSON.parse(responseContent);
      if (!parsedQuiz.questions || !Array.isArray(parsedQuiz.questions)) {
        throw new Error("Invalid format returned by AI");
      }
    } catch (e) {
      console.error("Failed to parse quiz JSON", e);
      res.status(500).json({ message: 'Failed to generate a valid quiz. Please try again.' });
      return;
    }

    res.json(parsedQuiz);

  } catch (error: any) {
    console.error('Error in quiz generation route:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

export default router;
