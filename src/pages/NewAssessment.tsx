import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentType, ManualFormData, EvidenceForUpload, EIAFormData, SIAFormData, HIAFormData, CIAFormData } from '../types';
import { ASSESSMENT_TYPES } from '../constants';
import { Button } from '../components/common/Button';
import { generateAssessmentReport } from '../services/geminiService';
import { ManualAssessmentModal } from '../components/ManualAssessmentModal';
import { useAssessments } from '../contexts/AssessmentContext';
import { useEvidence } from '../contexts/EvidenceContext';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';

// --- Helper Components defined in-file to avoid creating new files ---

const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file as a data URL.'));
        }
    };
    reader.onerror = error => reject(error);
});


const FileUpload: React.FC<{onFileChange: (file: File) => void; onRemove: () => void; file: File | null;}> = ({ onFileChange, onRemove, file }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
                alert("File is too large. Please select a file smaller than 4MB.");
                e.target.value = "";
                return;
            }
            onFileChange(selectedFile);
        }
    };

    if (file) {
        return (
             <div className="mt-2 p-2 border rounded-md bg-gray-50 flex justify-between items-center">
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
            </div>
        )
    }

    return (
        <input type="file" onChange={handleFileChange} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green-light/10 file:text-brand-green-light hover:file:bg-brand-green-light/20" accept="image/*,.pdf,.txt,.doc,.docx" />
    );
};


// --- Main Wizard Component ---

export const NewAssessment: React.FC = () => {
  const navigate = useNavigate();
  const { createAIAssessment } = useAssessments();
  const { addEvidence } = useEvidence();
  const { setTitle } = useLayout();
  const { getAccessToken } = useAuth();

  // Wizard State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Project Details
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>(AssessmentType.EIA);

  // Step 2: Evidence
  const [evidenceList, setEvidenceList] = useState<EvidenceForUpload[]>([]);
  const [currentEvidence, setCurrentEvidence] = useState<EvidenceForUpload>({ title: '', description: '', location: '', date_of_evidence: '', tags: []});

  useEffect(() => {
    setTitle('New AI-Powered Assessment');
  }, [setTitle]);

  const handleAddEvidence = () => {
      if (!currentEvidence.title || !currentEvidence.location || !currentEvidence.date_of_evidence) {
          alert("Please provide a title, location, and date for the evidence.");
          return;
      }
      setEvidenceList(prev => [...prev, currentEvidence]);
      setCurrentEvidence({ title: '', description: '', location: '', date_of_evidence: '', tags: [] }); // Reset form
  };
  
  const handleRemoveEvidence = (index: number) => {
      setEvidenceList(prev => prev.filter((_, i) => i !== index));
  };

  const STEPS = ["Project Details", "Attach Evidence", "Review & Generate"];

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Generate the main AI report
      const token = await getAccessToken();
      const report = await generateAssessmentReport(
        assessmentType,
        projectName,
        projectLocation,
        projectDescription,
        token
      );
      
      // 2. Create the assessment record in the database to get an ID
      const newAssessment = await createAIAssessment(report, {name: projectName, location: projectLocation});
      
      // 3. Upload all attached evidence, linking it to the new assessment ID
      for (const evidence of evidenceList) {
          let file_content: string | undefined;
          let file_mime_type: string | undefined;

          if (evidence.file) {
              file_content = await toBase64(evidence.file);
              file_mime_type = evidence.file.type;
          }
          await addEvidence({
              ...evidence,
              assessment_id: newAssessment.id,
              file_content,
              file_mime_type
          });
      }
      
      // 4. Navigate to the completed assessment detail page
      navigate(`/assessment/${newAssessment.id}`);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during the generation process.');
      setStep(3); // Go back to review step to show error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">New AI-Powered Assessment</h2>
      <p className="text-gray-500 mb-6">Follow the steps to generate a comprehensive report based on Kenyan environmental law.</p>

      {/* Stepper Navigation */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
        <ol className="flex items-center w-full">
          {STEPS.map((stepName, index) => (
             <li key={stepName} className={`flex w-full items-center ${index < STEPS.length - 1 ? "after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-300 after:border-1 after:inline-block" : ""}`}>
                <span className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${step > index + 1 ? 'bg-brand-green text-white' : step === index + 1 ? 'bg-brand-green-light text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {step > index + 1 ? <CheckCircleIcon className="w-6 h-6"/> : <span className="font-bold">{index + 1}</span>}
                </span>
                <span className={`ml-2 font-medium ${step >= index + 1 ? 'text-gray-800' : 'text-gray-500'}`}>{stepName}</span>
             </li>
          ))}
        </ol>
      </div>


      <div className="bg-white p-8 rounded-lg shadow-md">
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}
        
        {/* --- STEP 1: Project Details --- */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-700">1. Project Details</h3>
              <div>
                  <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">Type of Assessment</label>
                  <select id="assessmentType" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as AssessmentType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light">
                      {ASSESSMENT_TYPES.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input type="text" id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Lakeside Residential Complex" />
              </div>
              <div>
                  <label htmlFor="projectLocation" className="block text-sm font-medium text-gray-700 mb-1">Project Location</label>
                  <input type="text" id="projectLocation" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="e.g., Kisumu County, Kenya" />
              </div>
              <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
                  <textarea id="projectDescription" rows={5} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Describe the scope, scale, and nature of the proposed project..." />
              </div>
              <div className="text-right">
                  <Button onClick={() => setStep(2)} disabled={!projectName || !projectLocation || !projectDescription}>Next: Attach Evidence</Button>
              </div>
          </div>
        )}

        {/* --- STEP 2: Attach Evidence --- */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-700">2. Attach Supporting Evidence (Optional)</h3>
            <div className="p-4 border rounded-lg space-y-3">
                 <h4 className="font-semibold text-gray-800">Add New Evidence Item</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="text-sm font-medium text-gray-700">Title*</label>
                      <input type="text" value={currentEvidence.title} onChange={e => setCurrentEvidence(p => ({...p, title: e.target.value}))} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-700">Location*</label>
                      <input type="text" value={currentEvidence.location} onChange={e => setCurrentEvidence(p => ({...p, location: e.target.value}))} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700">Date of Evidence*</label>
                      <input type="date" value={currentEvidence.date_of_evidence} onChange={e => setCurrentEvidence(p => ({...p, date_of_evidence: e.target.value}))} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                  <div>
                      <label className="text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                      <input type="text" value={currentEvidence.tags?.join(', ')} onChange={e => setCurrentEvidence(p => ({...p, tags: e.target.value.split(',').map(t=>t.trim())}))} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" placeholder="e.g., water sample, photo, community feedback" />
                  </div>
                </div>
                 <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <textarea rows={2} value={currentEvidence.description} onChange={e => setCurrentEvidence(p => ({...p, description: e.target.value}))} className="w-full mt-1 p-2 border border-gray-300 rounded-md shadow-sm text-sm" />
                  </div>
                  <div>
                     <label className="text-sm font-medium text-gray-700">Attach File</label>
                     <FileUpload file={currentEvidence.file || null} onFileChange={file => setCurrentEvidence(p => ({...p, file}))} onRemove={() => setCurrentEvidence(p => ({...p, file: undefined}))} />
                  </div>
                  <div className="text-right">
                    <Button onClick={handleAddEvidence} variant="secondary">Add Evidence to List</Button>
                  </div>
            </div>
            
            {evidenceList.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Evidence to be Attached:</h4>
                  <ul className="space-y-2">
                    {evidenceList.map((ev, index) => (
                      <li key={index} className="p-2 border rounded-md bg-gray-50 flex justify-between items-center text-sm">
                          <span>{ev.title} {ev.file && `(${ev.file.name})`}</span>
                          <button onClick={() => handleRemoveEvidence(index)} className="text-red-500 hover:text-red-700 font-semibold">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button variant="secondary" onClick={() => setStep(1)}>Back: Project Details</Button>
              <Button onClick={() => setStep(3)}>Next: Review & Generate</Button>
            </div>
          </div>
        )}

        {/* --- STEP 3: Review & Generate --- */}
        {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-semibold text-gray-700">3. Review & Generate</h3>
              <div className="space-y-4 text-gray-700">
                  <div><strong>Project Name:</strong> {projectName}</div>
                  <div><strong>Location:</strong> {projectLocation}</div>
                  <div><strong>Assessment Type:</strong> {assessmentType}</div>
                  <div><strong>Description:</strong> <p className="whitespace-pre-wrap text-sm text-gray-600 p-2 bg-gray-50 rounded-md border">{projectDescription}</p></div>
                  <div><strong>Attached Evidence:</strong> {evidenceList.length > 0 ? evidenceList.map(e => e.title).join(', ') : 'None'}</div>
              </div>
               <div className="flex justify-between items-center">
                  <Button variant="secondary" onClick={() => setStep(2)} disabled={isLoading}>Back: Attach Evidence</Button>
                  <Button onClick={handleSubmit} isLoading={isLoading} disabled={isLoading}>
                      {isLoading ? 'Generating Report...' : 'Generate AI Report'}
                  </Button>
              </div>
            </div>
        )}

      </div>
    </div>
  );
};