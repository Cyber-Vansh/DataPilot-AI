import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { ChatSession } from '../models/ChatSession';

export const getHistory = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id })
      .select('title createdAt projectId isFavorite')
      .populate('projectId', 'name type')
      .sort({ isFavorite: -1, updatedAt: -1 })
      .limit(50);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const getHistoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

export const deleteHistoryItem = async (req: AuthRequest, res: Response) => {
  try {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    session.isFavorite = !session.isFavorite;
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update session' });
  }
};
