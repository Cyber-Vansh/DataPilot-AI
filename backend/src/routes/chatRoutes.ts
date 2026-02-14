import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { sendMessage } from '../controllers/chatController';

const router = express.Router();

router.post('/', authMiddleware, sendMessage);

export default router;
