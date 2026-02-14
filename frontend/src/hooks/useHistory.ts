import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface HistoryItem {
  _id: string;
  title: string;
  createdAt: string;
  isFavorite?: boolean;
  projectId?: {
    _id: string;
    name: string;
    type: 'mysql' | 'csv';
  };
}

export function useHistory() {
  const { token, logout } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  }, [token, logout]);

  const toggleFavorite = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/history/${id}/favorite`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchHistory();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/history/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchHistory();
        return true;
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
    return false;
  };

  return { history, fetchHistory, toggleFavorite, deleteHistoryItem };
}
