import React from 'react';
import { Link } from 'react-router-dom';
import { Assessment } from '../types';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { PencilSquareIcon } from './icons/PencilSquareIcon';

interface AssessmentCardProps {
  assessment: Assessment;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment }) => {

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300 relative">
      {assessment.type === 'Manual' && (
        <div className="absolute top-2 right-2 flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full" title="Manual Assessment">
            <PencilSquareIcon className="w-3 h-3 mr-1" />
            Manual
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{assessment.project_name}</h3>
          <p className="text-sm text-gray-500">{assessment.location}</p>
          <p className="text-xs text-gray-400 mt-1">
            Generated on: {new Date(assessment.date).toLocaleDateString()}
          </p>
        </div>
        <div className="p-2 bg-brand-green-light/10 rounded-full">
            <DocumentTextIcon className="h-6 w-6 text-brand-green-light" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 line-clamp-2">
            {assessment.report.assessmentTitle}
        </p>
      </div>
      <div className="mt-6 text-right">
        <Link
          to={`/assessment/${assessment.id}`}
          className="text-sm font-semibold text-brand-green-light hover:text-brand-green"
        >
          View Details &rarr;
        </Link>
      </div>
    </div>
  );
};