
import React, { useState, useEffect } from 'react';
import { UsersIcon } from '../components/icons/UsersIcon';
import { useForum } from '../contexts/ForumContext';
import { Button } from '../components/common/Button';
import { ForumThreadCard } from '../components/ForumThreadCard';
import { NewThreadModal } from '../components/NewThreadModal';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../constants';

export const CommunityForum: React.FC = () => {
  const { threads, isLoading, error, createThread } = useForum();
  const { isAuthenticated, hasRole } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setTitle } = useLayout();

  useEffect(() => {
    setTitle('Community Forum');
  }, [setTitle]);

  const handleCreateThread = async (title: string, content: string) => {
    try {
      await createThread(title, content);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create thread from component:", err);
      throw err;
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-brand-green-light" />
            <h2 className="text-3xl font-bold text-gray-800 ml-3">Community Forum</h2>
        </div>
        {isAuthenticated && hasRole([ROLES.PRACTITIONER, ROLES.ADMIN]) && (
          <Button onClick={() => setIsModalOpen(true)}>
              Start New Discussion
          </Button>
        )}
      </div>

      <p className="text-gray-600 mb-8 max-w-2xl">
        A space for legal practitioners, state officials, and the public to discuss environmental issues, share knowledge, and foster accountability.
      </p>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error loading forum</p>
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h4 className="text-lg font-medium text-gray-700">Loading discussions...</h4>
        </div>
      ) : threads.length > 0 ? (
        <div className="space-y-4">
            {threads.map((thread) => (
                <ForumThreadCard key={thread.id} thread={thread} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h4 className="text-lg font-medium text-gray-700">No discussions yet.</h4>
            <p className="text-gray-500 mt-2">Be the first to start a conversation!</p>
        </div>
      )}
      
      {isAuthenticated && (
        <NewThreadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateThread}
        />
      )}

    </div>
  );
};