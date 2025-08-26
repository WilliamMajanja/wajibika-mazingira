import React, { useState } from 'react';
import { Button } from './common/Button';

interface NewThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => Promise<void>;
}

export const NewThreadModal: React.FC<NewThreadModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and message cannot be empty.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await onSubmit(title, content);
      // On success, the parent component will handle closing the modal.
      // We don't need to do anything else here, as the component will unmount.
    } catch (err: any) {
      setError(err.message || 'Failed to create discussion.');
      // Only set loading to false on error, as on success the component unmounts.
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Start a New Discussion</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm" role="alert"><p>{error}</p></div>}
            <div>
              <label htmlFor="threadTitle" className="block text-sm font-medium text-gray-700 mb-1">Discussion Title</label>
              <input
                id="threadTitle"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter a clear and concise title"
                required
              />
            </div>
            <div>
              <label htmlFor="threadContent" className="block text-sm font-medium text-gray-700 mb-1">Your Message</label>
              <textarea
                id="threadContent"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Start the conversation here..."
                required
              ></textarea>
            </div>
          </div>
          <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post Discussion'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};