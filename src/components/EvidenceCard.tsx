import React, { useState, useEffect, useRef } from 'react';
import { Evidence } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { Spinner } from './common/Spinner';
import { XMarkIcon } from './icons/XMarkIcon';
import { useEvidence } from '../contexts/EvidenceContext';

export const EvidenceCard: React.FC<{evidence: Evidence}> = ({ evidence: initialEvidence }) => {
  const [fullEvidence, setFullEvidence] = useState<Evidence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { getEvidenceById } = useEvidence();

  const hasFile = !!initialEvidence.file_mime_type;
  const isImage = hasFile && initialEvidence.file_mime_type!.startsWith('image/');

  const fetchFullEvidence = async () => {
    if (fullEvidence) return fullEvidence; // Already loaded
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEvidenceById(initialEvidence.id);
      if (!data) throw new Error("File could not be loaded or permission denied.");
      setFullEvidence(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to load file.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleViewImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    triggerRef.current = e.currentTarget;
    const data = await fetchFullEvidence();
    if (data) setIsModalOpen(true);
  };
  
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const data = await fetchFullEvidence();
    if (data?.file_content && data?.file_mime_type) {
        const link = document.createElement('a');
        link.href = `data:${data.file_mime_type};base64,${data.file_content}`;
        link.download = `evidence_${data.id}.${data.file_mime_type.split('/')[1] || 'bin'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);


  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
        {isImage && (
          <div className="h-40 bg-gray-200 flex items-center justify-center relative">
             <button onClick={handleViewImage} className="w-full h-full text-center text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-green">
                {isLoading ? <Spinner size="sm" colorClass="border-brand-green-light" /> : <span>Click to view image</span>}
             </button>
          </div>
        )}
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-bold text-gray-800 pr-2" title={initialEvidence.title}>
              {initialEvidence.title}
            </h3>
            <div className="p-2 bg-brand-green-light/10 rounded-full flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-brand-green-light" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <GlobeAltIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {initialEvidence.location}
          </p>
          
          {initialEvidence.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {initialEvidence.description}
            </p>
          )}

          {initialEvidence.tags && initialEvidence.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
                {initialEvidence.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">{tag}</span>
                ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50/70 border-t flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <p><strong>Evidence Date:</strong> {new Date(initialEvidence.date_of_evidence).toLocaleDateString()}</p>
            <p><strong>Submitted:</strong> {new Date(initialEvidence.submitted_at).toLocaleDateString()}</p>
          </div>
          {hasFile && !isImage && (
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center text-sm font-semibold text-brand-green-light hover:text-brand-green disabled:opacity-50 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" colorClass="border-brand-green-light" />
                  <span className="ml-2">Loading...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1"/>
                  Download File
                </>
              )}
            </button>
          )}
        </div>
         {error && <p className="p-4 pt-0 text-xs text-red-500">{error}</p>}
      </div>
      
      {isModalOpen && fullEvidence?.file_content && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`modal-title-${initialEvidence.id}`}
        >
            <div className="relative bg-white p-2 rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
                 <h2 id={`modal-title-${initialEvidence.id}`} className="sr-only">Image viewer: {fullEvidence.title}</h2>
                <img 
                    src={`data:${fullEvidence.file_mime_type};base64,${fullEvidence.file_content}`}
                    alt={fullEvidence.title}
                    className="max-w-[90vw] max-h-[85vh] object-contain rounded-md"
                />
                <button
                    onClick={closeModal}
                    className="absolute -top-3 -right-3 bg-white rounded-full p-1.5 text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green shadow-lg"
                    aria-label="Close image viewer"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
      )}
    </>
  );
};