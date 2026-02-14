import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sql?: string;
  data?: (Record<string, unknown> | unknown[])[];
}

export function useChat() {
  const { token, logout } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const parseResult = (raw: unknown) => {
    if (typeof raw !== 'string') return raw;
    try {
      let cleaned = raw;
      cleaned = cleaned.replace(/Decimal\('([^']*)'\)/g, '$1');
      cleaned = cleaned.replace(/datetime\.datetime\(([^)]*)\)/g, (match: string, args: string) => {
        const parts = args.split(',').map(p => p.trim());
        return `"${parts.join('-')}"`; 
      });
      cleaned = cleaned.replace(/None/g, 'null');
      cleaned = cleaned.replace(/'/g, '"');
      cleaned = cleaned.replace(/\(/g, '[').replace(/\)/g, ']');
      cleaned = cleaned.replace(/,\s*]/g, ']');
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Failed to parse SQL result:", raw, error);
      return [];
    }
  };

  const sendMessage = async (question: string, projectId: string) => {
    if (!token) return;
    setLoading(true);
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          question, 
          sessionId,
          projectId
        })
      });
      
      if (res.status === 401) {
        logout();
        return;
      }

      const data = await res.json();
      
      if (data.sessionId) setSessionId(data.sessionId);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.sql ? "Query executed successfully." : "I couldn't generate a query for that.",
        sql: data.sql,
        data: parseResult(data.result)
      };
      setMessages(prev => [...prev, aiMsg]);
      return data.sessionId;
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Failed to connect to backend." }]);
    } finally {
      setLoading(false);
    }
  };

  const loadSession = useCallback(async (id: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/history/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) return logout();
      const data = await res.json();
      
      if (data.messages) {
         setSessionId(data._id);
         const loadedMessages = data.messages.map((msg: any, index: number) => ({
           id: index.toString(),
           role: msg.role,
           content: msg.content,
           sql: msg.sql,
           data: parseResult(msg.result)
         }));
         setMessages(loadedMessages);
         return data.projectId?._id || data.projectId;
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
        setLoading(false);
    }
    return null;
  }, [token, logout]);

  const clearChat = () => {
    setMessages([]);
    setSessionId(null);
  };

  return { messages, loading, sessionId, sendMessage, loadSession, clearChat };
}
