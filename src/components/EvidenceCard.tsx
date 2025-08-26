import React, { useState } from 'react';
import { Evidence } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { ArrowDownTrayIcon } from './icons/ArrowDownTrayIcon';
import { Spinner } from './common/Spinner';

export const EvidenceCard: React.FC<{evidence: Evidence}> = ({ evidence: initialEvidence }) => {
  const [fullEvidence, setFullEvidence] = useState<Evidence>(initialEvidence);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasFile = !!initialEvidence.file_mime_type;
  const isImage = hasFile && initialEvidence.file_mime_type!.startsWith('image/');

  const fetchAndShow = async () => {
    if (fullEvidence.file_content) {
      if (isImage) setIsModalOpen(true);
      return fullEvidence;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/evidence?id=${initialEvidence.id}`);
      if (!response.ok) {
        throw new Error("File could not be loaded.");
      }
      const data = await response.json();
      setFullEvidence(data);
      if (isImage) setIsModalOpen(true);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to load file.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrimaryAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isImage) {
      fetchAndShow();
    }
  };

  const triggerDownload = (evidenceToDownload: Evidence) => {
    if (!evidenceToDownload.file_content || !evidenceToDownload.file_mime_type) return;
    const link = document.createElement('a');
    link.href = `data:${evidenceToDownload.file_mime_type};base64,${evidenceToDownload.file_content}`;
    link.download = `evidence_${evidenceToDownload.id}.${evidenceToDownload.file_mime_type.split('/')[1] || 'bin'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const fetchedEvidence = await fetchAndShow();
    if (fetchedEvidence) {
      triggerDownload(fetchedEvidence);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col"
        onClick={isImage ? handlePrimaryAction : undefined}
        role={isImage ? "button" : "article"}
        aria-label={isImage ? `View image for ${fullEvidence.title}` : `Evidence details for ${fullEvidence.title}`}
      >
        {isImage && (
          <div className="h-40 bg-gray-200 flex items-center justify-center cursor-pointer">
            {fullEvidence.file_content ? (
              <img
                src={`data:${fullEvidence.file_mime_type};base64,${fullEvidence.file_content}`}
                alt={fullEvidence.title}
                className="w-full h-full object-cover"
              />
            ) : (
              isLoading ? <Spinner size="sm" /> : <span className="text-gray-500 text-sm">Click to view image</span>
            )}
          </div>
        )}
        <div className="p-4 flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-md font-bold text-gray-800 pr-2" title={fullEvidence.title}>
              {fullEvidence.title}
            </h3>
            <div className="p-2 bg-brand-green-light/10 rounded-full flex-shrink-0">
              <DocumentTextIcon className="h-5 w-5 text-brand-green-light" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1 flex items-center">
            <GlobeAltIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
            {fullEvidence.location}
          </p>
          
          {fullEvidence.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-3">
              {fullEvidence.description}
            </p>
          )}
        </div>

        <div className="p-4 bg-gray-50/70 border-t flex justify-between items-center">
          <div className="text-xs text-gray-500">
            <p><strong>Evidence Date:</strong> {new Date(fullEvidence.date_of_evidence).toLocaleDateString()}</p>
            <p><strong>Submitted:</strong> {new Date(fullEvidence.submitted_at).toLocaleDateString()}</p>
          </div>
          {hasFile && !isImage && (
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="flex items-center text-sm font-semibold text-brand-green-light hover:text-brand-green disabled:opacity-50 disabled:cursor-wait"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
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
           {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
      {isImage && isModalOpen && fullEvidence.file_content && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <img 
            src={`data:${fullEvidence.file_mime_type};base64,${fullEvidence.file_content}`}
            alt={fullEvidence.title}
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </>
  );
};
