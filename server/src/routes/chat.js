"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const generative_ai_1 = require("@google/generative-ai");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const router = express_1.default.Router();
router.use(auth_1.auth);
router.post('/', async (req, res) => {
    try {
        const { query, documentId } = req.body;
        if (!query || !documentId) {
            res.status(400).json({ message: 'Query and documentId are required.' });
            return;
        }
        // 1. Verify user owns the document
        const document = await prisma_1.default.document.findUnique({
            where: { id: documentId }
        });
        if (!document) {
            res.status(404).json({ message: 'Document not found.' });
            return;
        }
        if (document.userId !== req.user.id) {
            res.status(403).json({ message: 'Forbidden.' });
            return;
        }
        // 2. Generate embedding for the query using Gemini
        let queryEmbedding;
        try {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey)
                throw new Error("GEMINI_API_KEY is not set.");
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
            const requestPayload = {
                content: { role: "user", parts: [{ text: query }] },
                outputDimensionality: 768
            };
            const result = await model.embedContent(requestPayload);
            queryEmbedding = result.embedding.values;
        }
        catch (error) {
            console.error('Error generating query embedding via Gemini:', error);
            res.status(500).json({ message: 'Failed to connect to Gemini API for embeddings.' });
            return;
        }
        // 3. Perform Vector Search (Cosine Similarity)
        const vectorString = `[${queryEmbedding.join(',')}]`;
        const similarChunks = await prisma_1.default.$queryRaw `
      SELECT 
        c.id, 
        c.content, 
        p."pageNumber",
        1 - (c.embedding <=> ${vectorString}::vector) as similarity
      FROM "DocumentChunk" c
      JOIN "DocumentPage" p ON c."pageId" = p.id
      WHERE p."documentId" = ${documentId}
      ORDER BY c.embedding <=> ${vectorString}::vector
      LIMIT 5;
    `;
        if (!similarChunks || similarChunks.length === 0) {
            res.status(404).json({ message: 'No relevant information found in the document.' });
            return;
        }
        // 4. Construct context from top chunks
        const contextText = similarChunks.map(chunk => chunk.content).join('\n\n');
        // 5. Generate Answer via Groq
        const prompt = `You are an AI assistant helping a user understand their document.
Answer the user's question based ONLY on the provided context. If you don't know the answer based on the context, say "I couldn't find the answer in this document."

Context from document:
${contextText}

Question:
${query}

Answer:`;
        try {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey)
                throw new Error("GROQ_API_KEY is not set.");
            const groq = new groq_sdk_1.default({ apiKey: groqApiKey });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "groq/compound-mini",
            });
            const sourcePages = Array.from(new Set(similarChunks.map(chunk => chunk.pageNumber))).sort((a, b) => a - b);
            res.json({
                answer: completion.choices[0]?.message?.content || "",
                sources: sourcePages
            });
        }
        catch (error) {
            console.error('Error generating answer via Groq:', error);
            res.status(500).json({ message: 'Failed to connect to Groq to generate an answer.' });
            return;
        }
    }
    catch (error) {
        console.error('Error in chat route:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
router.post('/global', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            res.status(400).json({ message: 'Query is required.' });
            return;
        }
        // 1. Generate embedding for the query using Gemini
        let queryEmbedding;
        try {
            const geminiApiKey = process.env.GEMINI_API_KEY;
            if (!geminiApiKey)
                throw new Error("GEMINI_API_KEY is not set.");
            const genAI = new generative_ai_1.GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
            const requestPayload = {
                content: { role: "user", parts: [{ text: query }] },
                outputDimensionality: 768
            };
            const result = await model.embedContent(requestPayload);
            queryEmbedding = result.embedding.values;
        }
        catch (error) {
            console.error('Error generating query embedding via Gemini:', error);
            res.status(500).json({ message: 'Failed to connect to Gemini API for embeddings.' });
            return;
        }
        // 2. Perform Vector Search across ALL documents for the user
        const vectorString = `[${queryEmbedding.join(',')}]`;
        const similarChunks = await prisma_1.default.$queryRaw `
      SELECT 
        c.id, 
        c.content, 
        p."pageNumber",
        d.title as "documentTitle",
        1 - (c.embedding <=> ${vectorString}::vector) as similarity
      FROM "DocumentChunk" c
      JOIN "DocumentPage" p ON c."pageId" = p.id
      JOIN "Document" d ON p."documentId" = d.id
      WHERE d."userId" = ${req.user.id}
      ORDER BY c.embedding <=> ${vectorString}::vector
      LIMIT 8;
    `;
        if (!similarChunks || similarChunks.length === 0) {
            res.status(404).json({ message: 'No relevant information found in your documents.' });
            return;
        }
        // 3. Construct context from top chunks
        const contextText = similarChunks.map(chunk => `[Document: ${chunk.documentTitle}, Page: ${chunk.pageNumber}]\n${chunk.content}`).join('\n\n');
        // 4. Generate Answer via Groq
        const prompt = `You are an AI assistant helping a user understand their documents.
Answer the user's question based ONLY on the provided context from their knowledge base. 
If you don't know the answer based on the context, say "I couldn't find the answer in your documents."

Context from documents:
${contextText}

Question:
${query}

Answer:`;
        try {
            const groqApiKey = process.env.GROQ_API_KEY;
            if (!groqApiKey)
                throw new Error("GROQ_API_KEY is not set.");
            const groq = new groq_sdk_1.default({ apiKey: groqApiKey });
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "groq/compound-mini",
            });
            res.json({
                answer: completion.choices[0]?.message?.content || "",
            });
        }
        catch (error) {
            console.error('Error generating answer via Groq:', error);
            res.status(500).json({ message: 'Failed to connect to Groq to generate an answer.' });
            return;
        }
    }
    catch (error) {
        console.error('Error in global chat route:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
router.post('/format', async (req, res) => {
    try {
        const { chunks } = req.body;
        if (!chunks || !Array.isArray(chunks)) {
            res.status(400).json({ message: 'Array of chunks is required.' });
            return;
        }
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey)
            throw new Error("GROQ_API_KEY is not set.");
        const groq = new groq_sdk_1.default({ apiKey: groqApiKey });
        // Format all chunks in a single prompt to save time and API calls
        const prompt = `You are a text formatter. The following array of texts were extracted from a PDF, but some words are squashed together because of missing space characters (e.g. "actuallyrunyourapplications").
Please fix the missing spaces in each text and return the EXACT same array of texts, in the EXACT same order. Do not change the meaning of the text, just fix the spaces and typos.

Input Texts:
${JSON.stringify(chunks)}

Output a JSON object with a single key "texts" that contains the array of formatted strings.`;
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "groq/compound-mini",
            response_format: { type: "json_object" }, // groq supports json_object if prompted properly
        });
        const responseContent = completion.choices[0]?.message?.content || "{}";
        // Parse the JSON array. Since we used json_object, it might return { "formatted": [...] } or just the array.
        let formattedChunks = chunks; // fallback
        try {
            const parsed = JSON.parse(responseContent);
            if (Array.isArray(parsed)) {
                formattedChunks = parsed;
            }
            else if (parsed.formatted && Array.isArray(parsed.formatted)) {
                formattedChunks = parsed.formatted;
            }
            else if (parsed.texts && Array.isArray(parsed.texts)) {
                formattedChunks = parsed.texts;
            }
        }
        catch (e) {
            console.error("Failed to parse formatted chunks", e);
        }
        res.json({ formattedChunks });
    }
    catch (error) {
        console.error('Error in format route:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map