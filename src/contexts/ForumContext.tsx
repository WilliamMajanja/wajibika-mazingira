import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ForumThread, ForumMessage } from '../types';
import { useAuth } from './AuthContext';

interface ForumContextType {
  threads: ForumThread[];
  isLoading: boolean;
  error: string | null;
  createThread: (title: string, content: string) => Promise<void>;
  getThreadById: (threadId: string) => Promise<ForumThread | null>;
  addMessageToThread: (threadId: string, content: string) => Promise<ForumMessage | null>;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export const ForumProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, getAccessToken } = useAuth();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/forum-threads');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: 'Failed to fetch forum threads.'}));
        throw new Error(errorData.error);
      }
      const data: ForumThread[] = await response.json();
      setThreads(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const createThread = async (title: string, content: string) => {
    if (!isAuthenticated) throw new Error("User not authenticated.");

    try {
        const token = await getAccessToken();
        const response = await fetch('/api/forum-threads', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });
        if(!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create thread.');
        }
        const newThread = await response.json();
        setThreads(prev => [newThread, ...prev]);

    } catch(err: any) {
        setError(err.message);
        throw err;
    }
  };

  const getThreadById = async (threadId: string): Promise<ForumThread | null> => {
     try {
        const response = await fetch(`/api/forum-threads?id=${threadId}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            const err = await response.json().catch(() => ({error: 'Failed to fetch thread details.'}));
            throw new Error(err.error || 'Failed to fetch thread.');
        }
        return await response.json();
    } catch(err: any) {
        console.error("Error in getThreadById:", err);
        setError(err.message);
        throw err;
    }
  }

  const addMessageToThread = async (threadId: string, content: string): Promise<ForumMessage | null> => {
    if (!isAuthenticated) throw new Error("User not authenticated.");

    try {
        const token = await getAccessToken();
        const response = await fetch('/api/forum-messages', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ threadId, content })
        });
        if(!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to add message.');
        }
        
        setThreads(prevThreads => prevThreads.map(t => 
            t.id === threadId ? { ...t, reply_count: t.reply_count + 1, last_reply_at: new Date().toISOString() } : t
        ).sort((a,b) => new Date(b.last_reply_at || b.created_at).getTime() - new Date(a.last_reply_at || a.created_at).getTime()));
        
        return await response.json();
    } catch (err: any) {
        setError(err.message);
        throw err;
    }
  };

  const value = {
    threads,
    isLoading,
    error,
    createThread,
    getThreadById,
    addMessageToThread,
  };

  return <ForumContext.Provider value={value}>{children}</ForumContext.Provider>;
};

export const useForum = (): ForumContextType => {
  const context = useContext(ForumContext);
  if (context === undefined) {
    throw new Error('useForum must be used within a ForumProvider');
  }
  return context;
};
