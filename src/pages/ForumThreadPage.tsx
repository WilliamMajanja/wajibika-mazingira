import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForum } from '../contexts/ForumContext';
import { ForumThread, ForumMessage } from '../types';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { UserCircleIcon } from '../components/icons/UserCircleIcon';
import { useLayout } from '../contexts/LayoutContext';

const ThumbUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904M6.633 10.25l-2.006-2.006a.75.75 0 0 0-1.06 0 1.5 1.5 0 0 0 0 2.122l2.006 2.006M6.633 10.25H2.25a.75.75 0 0 1-.75-.75V8.25c0-.414.336-.75.75-.75h4.383c.29 0 .57.112.776.31l2.006 2.006a.75.75 0 0 0 1.06 0c.29-.29.29-.767 0-1.058l-2.006-2.006a.75.75 0 0 0-1.06 0l-2.006 2.006a.75.75 0 0 0 0 1.06l2.006 2.006" />
  </svg>
);


export const ForumThreadPage: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const { getThreadById, addMessageToThread, toggleMessageLike } = useForum();
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

  const handleLikeMessage = async (messageId: string) => {
    if (!threadId || !isAuthenticated) return;
    
    // Optimistic UI update
    setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
            const isLiked = msg.liked_by.includes(user!.sub!);
            return {
                ...msg,
                likes: isLiked ? msg.likes - 1 : msg.likes + 1,
                liked_by: isLiked ? msg.liked_by.filter(id => id !== user!.sub!) : [...msg.liked_by, user!.sub!]
            }
        }
        return msg;
    }));

    try {
        await toggleMessageLike(messageId);
    } catch (err) {
        // Revert on error
        const fetchedThread = await getThreadById(threadId);
        if(fetchedThread) setMessages(fetchedThread.messages || []);
        console.error("Failed to toggle like:", err);
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
    const isLikedByCurrentUser = user ? message.liked_by.includes(user.sub!) : false;

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
            <div className="flex justify-between items-center mb-1">
                <p className="font-bold text-sm">{authorName}</p>
                 <button 
                  onClick={() => handleLikeMessage(message.id)} 
                  disabled={!isAuthenticated}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${isLikedByCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} disabled:opacity-50`}
                >
                    <ThumbUpIcon className="h-4 w-4" /> {message.likes}
                </button>
            </div>
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
          {thread.assessment_name && ` | Linked to: ${thread.assessment_name}`}
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