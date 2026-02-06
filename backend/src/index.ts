import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
import { ChatSession } from './models/ChatSession';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/chat_history';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:5001';

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/history', async (req: Request, res: Response) => {
  try {
    const sessions = await ChatSession.find()
      .select('title createdAt')
      .sort({ updatedAt: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/history/:id', async (req: Request, res: Response) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.post('/api/chat', async (req: Request, res: Response) => {
  const { question, sessionId } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/query`, { question });
    const { sql, data } = aiResponse.data;

    const userMessage = { role: 'user', content: question };
    const aiMessage = { role: 'ai', content: data.sql ? "Query executed successfully." : "I couldn't generate a query for that.", sql, result: data };

    let session;
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
      if (session) {
        session.messages.push(userMessage, aiMessage);
        await session.save();
      }
    }

    if (!session) {
      session = new ChatSession({
        title: question.substring(0, 50) + (question.length > 50 ? '...' : ''),
        messages: [userMessage, aiMessage]
      });
      await session.save();
    }

    res.json({ 
      sessionId: session._id, 
      messages: [userMessage, aiMessage],
      sql, 
      result: data 
    });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
