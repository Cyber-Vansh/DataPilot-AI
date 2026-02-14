import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';
import fs from 'fs';
import { Project } from './models/Project';
import { ChatSession } from './models/ChatSession';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import chatRoutes from './routes/chatRoutes';
import historyRoutes from './routes/historyRoutes';
import { PORT, MONGO_URI, AI_SERVICE_URL } from './config/env';

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      console.log('Starting project cleanup...');
      const projects = await Project.find({ type: 'csv' });
      let deletedCount = 0;
      
      for (const project of projects) {
        const proj = project as any;
        if (proj.csvPath && !fs.existsSync(proj.csvPath)) {
          console.log(`Deleting invalid project: ${proj.name} (File missing: ${proj.csvPath})`);
          await ChatSession.deleteMany({ projectId: proj._id });
          await Project.deleteOne({ _id: proj._id });
          deletedCount++;
        }
      }
      console.log(`Project cleanup complete. Removed ${deletedCount} invalid projects.`);
    } catch (err) {
      console.error('Error during project cleanup:', err);
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/api/health', async (req: Request, res: Response) => {
  console.log(`[Health Check] Checking AI Service at ${AI_SERVICE_URL}...`);
  try {
    const aiHealth = await axios.get(`${AI_SERVICE_URL}/`, { timeout: 10000 });
    console.log(`[Health Check] AI Service responded: ${aiHealth.status}`);
    res.json({ 
      status: 'ok', 
      service: 'backend', 
      aiService: aiHealth.status === 200 ? 'ok' : 'error' 
    });
  } catch (error) {
    console.error(`[Health Check] AI Service failed:`, error instanceof Error ? error.message : error);
    res.json({ 
      status: 'ok', 
      service: 'backend', 
      aiService: 'down' 
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
