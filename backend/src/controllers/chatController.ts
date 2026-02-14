import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Project } from '../models/Project';
import { ChatSession } from '../models/ChatSession';
import fs from 'fs';
import axios from 'axios';
import { AI_SERVICE_URL } from '../config/env';

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { question, sessionId, projectId } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  if (!sessionId && !projectId) {
    return res.status(400).json({ error: 'Project ID is required for new chats' });
  }

  try {
    let project;
    let session;

    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId: req.user.id }).populate('projectId');
      if (session) {
         project = session.projectId;
      }
    } 
    
    if (!project && projectId) {
      project = await Project.findOne({ _id: projectId, userId: req.user.id });
    }

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const proj = project as any;
    
    const dbConnection: any = {
      type: proj.type,
      config: proj.type === 'mysql' ? proj.dbConfig : { csvPath: proj.csvPath }
    };

    if (proj.type === 'csv' && proj.csvPath) {
       try {
         const fileContent = fs.readFileSync(proj.csvPath, 'utf8');
         dbConnection.config.csvContent = fileContent;
       } catch (err) {
         console.error("Error reading CSV file for query:", err);
       }
    }

    let history: string[] = [];
    if (session && session.messages) {
       const lastMessages = session.messages.slice(-10);
       history = lastMessages.map((msg: any) => {
          return `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`; 
       });
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/query`, { 
      question,
      db_connection: dbConnection,
      history
    });
    const { sql, data } = aiResponse.data;

    const userMessage = { role: 'user', content: question };
    const aiMessage = { role: 'ai', content: data.sql ? "Query executed successfully." : "I couldn't generate a query for that.", sql, result: data };

    if (session) {
      session.messages.push(userMessage, aiMessage);
      await session.save();
    } else {
      session = new ChatSession({
        userId: req.user.id,
        projectId: project._id,
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
    res.status(500).json({ error: 'Failed to process query' });
  }
};
