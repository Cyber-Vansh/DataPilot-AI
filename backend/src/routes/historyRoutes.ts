import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { getHistory, getHistoryItem, deleteHistoryItem, toggleFavorite } from '../controllers/historyController';

const router = express.Router();

router.get('/', authMiddleware, getHistory);
router.get('/:id', authMiddleware, getHistoryItem);
router.delete('/:id', authMiddleware, deleteHistoryItem);
router.put('/:id/favorite', authMiddleware, toggleFavorite);

export default router;
