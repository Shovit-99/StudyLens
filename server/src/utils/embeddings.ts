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
    
    // We send requests sequentially to avoid rate limits
    for (const text of texts) {
      const requestPayload: any = { 
        content: { role: "user", parts: [{ text: text }] }, 
        outputDimensionality: 768 
      };
      const result = await model.embedContent(requestPayload);
      embeddings.push(result.embedding.values);
    }
    
    return embeddings;
  } catch (error: any) {
    console.error('Error generating embeddings via Gemini:', error.message);
    throw new Error('Failed to generate embeddings using Gemini API.');
  }
}


