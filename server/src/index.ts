import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import subjectRoutes from './routes/subjects';
import documentRoutes from './routes/documents';
import searchRoutes from './routes/search';
import chatRoutes from './routes/chat';
import quizRoutes from './routes/quiz';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy to enable correct IP tracking for rate limiters on platforms like Render
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ message: 'StudyLens API running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
