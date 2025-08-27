import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ForumThread, ForumMessage } from '../types';
import { useAuth } from './AuthContext';

interface ForumContextType {
  threads: ForumThread[];
  isLoading: boolean;
  error: string | null;
  createThread: (title: string, content: string, assessment_id?: string) => Promise<void>;
  getThreadById: (threadId: string) => Promise<ForumThread | null>;
  getThreadsForAssessment: (assessmentId: string) => Promise<ForumThread[]>;
  addMessageToThread: (threadId: string, content: string) => Promise<ForumMessage | null>;
  toggleMessageLike: (messageId: string) => Promise<void>;
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

  const createThread = async (title: string, content: string, assessment_id?: string) => {
    if (!isAuthenticated) throw new Error("User not authenticated.");

    try {
        const token = await getAccessToken();
        const response = await fetch('/api/forum-threads', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title, content, assessment_id })
        });
        if(!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create thread.');
        }
        await fetchThreads(); // refetch all threads to update list
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

  const getThreadsForAssessment = async (assessmentId: string): Promise<ForumThread[]> => {
      // This is a client-side filter for simplicity. For large scale, this would be a separate API endpoint.
      return threads.filter(t => t.assessment_id === assessmentId);
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

  const toggleMessageLike = async (messageId: string) => {
      if (!isAuthenticated) throw new Error("User not authenticated.");
      try {
        const token = await getAccessToken();
        const response = await fetch('/api/forum-messages', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ action: 'toggle_like', messageId })
        });
        if(!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update like status.');
        }
      } catch (err: any) {
        // Error is handled via optimistic UI revert in component
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
    getThreadsForAssessment,
    toggleMessageLike,
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