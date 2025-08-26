import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForum } from '../contexts/ForumContext';
import { ForumThread, ForumMessage } from '../types';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { useLayout } from '../contexts/LayoutContext';

export const ForumThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { getThreadById, addMessageToThread } = useForum();
  const { user, isAuthenticated } = useAuth();
  const { setTitle } = useLayout();

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedThread = await getThreadById(threadId);
        if (fetchedThread) {
          setThread(fetchedThread);
          setMessages(fetchedThread.messages || []);
          setTitle(`Thread: ${fetchedThread.title}`);
        } else {
          setError('Thread not found.');
          setTitle('Thread Not Found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load thread.');
        setTitle('Error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchThread();
  }, [threadId, getThreadById, setTitle]);

   useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !threadId) return;

    setIsPosting(true);
    try {
        const postedMessage = await addMessageToThread(threadId, newMessage);
        if (postedMessage) {
            setMessages(prev => [...prev, postedMessage]);
            setNewMessage('');
        }
    } catch (err) {
        console.error("Failed to post reply:", err);
    } finally {
        setIsPosting(false);
    }
  }

  if (isLoading) {
    return <div className="text-center py-12">Loading thread...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">{error}</div>;
  }

  if (!thread) {
    return <div className="text-center py-12">Thread not found.</div>;
  }
  
  const threadAuthorName = thread.author?.name || 'Anonymous';

  const MessageBubble: React.FC<{ message: ForumMessage }> = ({ message }) => {
    const isAuthor = message.author.id === user?.sub;
    const authorName = message.author?.name || 'Anonymous';
    const authorAvatar = message.author?.picture;

    return (
      <div className={`flex items-start gap-3 my-4 ${isAuthor ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="flex-shrink-0">
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="h-10 w-10 rounded-full" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-brand-dark-light flex items-center justify-center">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        <div className={`rounded-lg p-4 max-w-2xl shadow-sm ${isAuthor ? 'bg-brand-green-light text-white' : 'bg-white'}`}>
            <p className="font-bold text-sm mb-1">{authorName}</p>
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs opacity-70 mt-2 text-right">{new Date(message.created_at).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mb-4">
        <Link to="/community-forum" className="text-brand-green-light hover:text-brand-green font-semibold text-sm">
            &larr; Back to All Discussions
        </Link>
        <h2 className="text-3xl font-bold text-gray-800 mt-2">{thread.title}</h2>
        <p className="text-gray-500 text-sm">
          Started by {threadAuthorName} on {new Date(thread.created_at).toLocaleDateString()}
        </p>
      </div>
      
      <div className="flex-grow bg-gray-50/50 rounded-lg p-4 overflow-y-auto border">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4">
        <form onSubmit={handlePostReply} className="flex items-start gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAuthenticated ? "Write your reply..." : "Please log in to post a reply."}
            className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
            rows={3}
            disabled={isPosting || !isAuthenticated}
          />
          <Button type="submit" isLoading={isPosting} disabled={!newMessage.trim() || isPosting || !isAuthenticated}>
            Post Reply
          </Button>
        </form>
      </div>
    </div>
  );
};
