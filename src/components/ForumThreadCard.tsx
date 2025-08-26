import React from 'react';
import { Link } from 'react-router-dom';
import { ForumThread } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';

interface ForumThreadCardProps {
  thread: ForumThread;
}

export const ForumThreadCard: React.FC<ForumThreadCardProps> = ({ thread }) => {
  const { author } = thread;
  const authorName = author?.name || 'Anonymous';
  const authorAvatar = author?.picture;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
      <div className="flex items-center">
        {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full" />
        ) : (
            <div className="w-10 h-10 rounded-full bg-brand-dark-light flex items-center justify-center text-white">
                <UserCircleIcon className="h-6 w-6"/>
            </div>
        )}
        <div className="ml-4">
          <Link to={`/community-forum/${thread.id}`} className="font-bold text-gray-800 text-lg hover:text-brand-green-light hover:underline">
            {thread.title}
          </Link>
          <p className="text-sm text-gray-500">
            Started by <span className="font-medium">{authorName}</span> on {new Date(thread.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-center px-4 flex-shrink-0">
          <p className="text-2xl font-bold text-gray-700">{thread.reply_count -1}</p>
          <p className="text-sm text-gray-500">replies</p>
      </div>
    </div>
  );
};
