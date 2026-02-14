import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface Project {
  _id: string;
  name: string;
  type: 'mysql' | 'csv';
  dbConfig?: {
    host: string;
    user: string;
    database: string;
  };
}

export function useProjects() {
  const { token, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      if (!res.ok) throw new Error('Failed to fetch projects');
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  const createProject = async (data: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchProjects();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const uploadProject = async (file: File, name: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchProjects();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const updateProject = async (id: string, data: any) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchProjects();
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const deleteProject = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      if (res.ok) {
        setProjects(prev => prev.filter(p => p._id !== id));
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  return { 
    projects, 
    loading, 
    fetchProjects, 
    createProject, 
    uploadProject,
    updateProject,
    deleteProject 
  };
}
