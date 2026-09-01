import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates vector embeddings for a given array of strings.
 * Uses Google Gemini's text-embedding-004 model.
 * 
 * @param texts Array of strings to embed
 * @returns Array of embedding vectors (number[][])
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });

  try {
    const embeddings: number[][] = [];
    
    // Process in batches of 50 to avoid hitting limits or oversized payloads
    const BATCH_SIZE = 50;
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const requests = batchTexts.map(text => ({
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: 768
      }));
      
      let success = false;
      let retries = 0;
      
      while (!success && retries < 3) {
        try {
          const result = await model.batchEmbedContents({ requests });
          embeddings.push(...result.embeddings.map(e => e.values));
          success = true;
        } catch (error: any) {
          if (error.message && error.message.includes('429 Too Many Requests')) {
            console.warn(`[Gemini API] Rate limit hit. Waiting 60 seconds before retrying batch (Retry ${retries + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
            retries++;
          } else {
            throw error;
          }
        }
      }
      
      if (!success) {
        throw new Error('Failed to generate embeddings after multiple retries due to rate limits.');
      }
    }
    
    return embeddings;
  } catch (error: any) {
    console.error('Error generating embeddings via Gemini:', error.message);
    throw new Error('Failed to generate embeddings using Gemini API.');
  }
}


