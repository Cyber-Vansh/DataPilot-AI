import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/chat_history';
export const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:5001';
export const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
