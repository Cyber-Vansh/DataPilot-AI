import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Project } from '../models/Project';
import { ChatSession } from '../models/ChatSession';
import fs from 'fs';
import axios from 'axios';
import multer from 'multer';
import { AI_SERVICE_URL } from '../config/env';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

export const listProjects = async (req: AuthRequest, res: Response) => {
  try {
    const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  const { name, type, dbConfig } = req.body;
  
  if (type !== 'mysql') return res.status(400).json({ error: 'Invalid project type' });

  try {
    const project = new Project({
      userId: req.user.id,
      name,
      type,
      dbConfig
    });
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  const { name, dbConfig } = req.body;
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (name) project.name = name;
    if (dbConfig && project.type === 'mysql') {
       project.dbConfig = { ...project.dbConfig, ...dbConfig };
    }
    
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    
    await ChatSession.deleteMany({ projectId: project._id });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const uploadProject = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const project = new Project({
      userId: req.user.id,
      name,
      type: 'csv',
      csvPath: req.file.path
    });
    await project.save();
    res.json(project);
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: 'Failed to upload CSV project' });
  }
};

export const getProjectSchema = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

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
        console.error("Error reading CSV file:", err);
      }
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/schema`, { 
      db_connection: dbConnection
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error("Schema fetch error:", error);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
};

export const getProjectSuggestions = async (req: AuthRequest, res: Response) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user.id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

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
        console.error("Error reading CSV file:", err);
      }
    }

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/suggest_questions`, { 
      db_connection: dbConnection
    });

    res.json(aiResponse.data);
  } catch (error) {
    console.error("Suggestions fetch error:", error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
};
