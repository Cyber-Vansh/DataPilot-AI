import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { 
  listProjects, createProject, updateProject, deleteProject, 
  uploadProject, getProjectSchema, getProjectSuggestions, upload
} from '../controllers/projectController';

const router = express.Router();

router.get('/', authMiddleware, listProjects);
router.post('/', authMiddleware, createProject);
router.put('/:id', authMiddleware, updateProject);
router.delete('/:id', authMiddleware, deleteProject);
router.post('/upload', authMiddleware, upload.single('file'), uploadProject);
router.get('/:id/schema', authMiddleware, getProjectSchema);
router.get('/:id/suggestions', authMiddleware, getProjectSuggestions);

export default router;
