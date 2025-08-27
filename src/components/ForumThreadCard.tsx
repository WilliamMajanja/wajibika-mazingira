import React from 'react';
import { Link } from 'react-router-dom';
import { ForumThread } from '../types';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';

interface ForumThreadCardProps {
  thread: ForumThread;
}

export const ForumThreadCard: React.FC<ForumThreadCardProps> = ({ thread }) => {
  const { author } = thread;
  const authorName = author?.name || 'Anonymous';
  const authorAvatar = author?.picture;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center justify-between">
      <div className="flex items-center flex-grow min-w-0">
        {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
            <div className="w-10 h-10 rounded-full bg-brand-dark-light flex items-center justify-center text-white flex-shrink-0">
                <UserCircleIcon className="h-6 w-6"/>
            </div>
        )}
        <div className="ml-4 min-w-0">
          <Link to={`/community-forum/${thread.id}`} className="font-bold text-gray-800 text-lg hover:text-brand-green-light hover:underline truncate block">
            {thread.title}
          </Link>
          <div className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-x-2">
            <span>Started by <span className="font-medium">{authorName}</span> on {new Date(thread.created_at).toLocaleDateString()}</span>
            {thread.assessment_id && thread.assessment_name && (
                <>
                    <span className="text-gray-300">|</span>
                    <Link to={`/assessment/${thread.assessment_id}`} className="flex items-center gap-1 text-brand-green hover:underline">
                        <DocumentTextIcon className="h-4 w-4" />
                        <span>{thread.assessment_name}</span>
                    </Link>
                </>
            )}
          </div>
        </div>
      </div>
      <div className="text-center px-4 flex-shrink-0 ml-4">
          <p className="text-2xl font-bold text-gray-700">{thread.reply_count > 0 ? thread.reply_count -1 : 0}</p>
          <p className="text-sm text-gray-500">replies</p>
      </div>
    </div>
  );
};