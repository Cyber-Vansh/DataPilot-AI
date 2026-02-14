import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useSuggestions() {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async (projectId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/projects/${projectId}/suggestions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          setSuggestions(data.questions);
        }
      }
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { suggestions, loading, fetchSuggestions, clearSuggestions };
}
