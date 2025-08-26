import React, { useState, useMemo } from 'react';
import { Button } from './common/Button';
import { ASSESSMENT_TYPES } from '../constants';
import { AssessmentType, ManualFormData, EIAFormData, CIAFormData, SIAFormData, HIAFormData } from '../types';

interface ManualAssessmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        projectDetails: { name: string; location: string; assessmentType: AssessmentType },
        formData: ManualFormData
    ) => Promise<void>;
}

const initialEiaData: EIAFormData = { assessmentType: AssessmentType.EIA, environmentalSetting: '', potentialImpacts: '', mitigationMeasures: '', publicConsultationSummary: '' };
const initialCiaData: CIAFormData = { assessmentType: AssessmentType.CIA, ghgEmissionsEstimate: '', climateVulnerability: '', adaptationMeasures: '', nccapAlignment: '' };
const initialSiaData: SIAFormData = { assessmentType: AssessmentType.SIA, affectedCommunities: '', potentialSocialImpacts: '', communityEngagementPlan: '', benefitSharingMechanism: '' };
const initialHiaData: HIAFormData = { assessmentType: AssessmentType.HIA, potentialHealthRisks: '', affectedPopulationGroups: '', healthSystemCapacity: '', healthMitigationMeasures: '' };


const TextareaField: React.FC<{id: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder: string, isRequired?: boolean}> = ({ id, label, value, onChange, placeholder, isRequired = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}{isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
            id={id}
            rows={4}
            value={value}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
            placeholder={placeholder}
            required={isRequired}
        />
    </div>
);

const EIAForm: React.FC<{data: EIAFormData, setData: React.Dispatch<React.SetStateAction<EIAFormData>>}> = ({ data, setData }) => (
    <div className="space-y-4">
        <TextareaField id="envSetting" label="Environmental Setting" value={data.environmentalSetting} onChange={e => setData(d => ({...d, environmentalSetting: e.target.value}))} placeholder="Describe the location, climate, geology, water resources, biodiversity, etc." isRequired />
        <TextareaField id="potentialImpacts" label="Potential Environmental Impacts" value={data.potentialImpacts} onChange={e => setData(d => ({...d, potentialImpacts: e.target.value}))} placeholder="Detail potential impacts on air, water, soil, noise, and waste generation." isRequired />
        <TextareaField id="mitigationMeasures" label="Proposed Mitigation Measures" value={data.mitigationMeasures} onChange={e => setData(d => ({...d, mitigationMeasures: e.target.value}))} placeholder="List measures to prevent or reduce negative environmental impacts." isRequired />
        <TextareaField id="publicConsultation" label="Public Consultation Summary" value={data.publicConsultationSummary} onChange={e => setData(d => ({...d, publicConsultationSummary: e.target.value}))} placeholder="Summarize the feedback received from public and stakeholder consultations." isRequired />
    </div>
);

const CIAForm: React.FC<{data: CIAFormData, setData: React.Dispatch<React.SetStateAction<CIAFormData>>}> = ({ data, setData }) => (
    <div className="space-y-4">
        <TextareaField id="ghgEmissions" label="Greenhouse Gas (GHG) Emissions Estimate" value={data.ghgEmissionsEstimate} onChange={e => setData(d => ({...d, ghgEmissionsEstimate: e.target.value}))} placeholder="Provide an estimate of the project's expected GHG emissions." isRequired />
        <TextareaField id="climateVulnerability" label="Vulnerability to Climate Change" value={data.climateVulnerability} onChange={e => setData(d => ({...d, climateVulnerability: e.target.value}))} placeholder="Analyze the project's vulnerability to risks like flooding, drought, sea-level rise, etc." isRequired />
        <TextareaField id="adaptationMeasures" label="Proposed Adaptation Measures" value={data.adaptationMeasures} onChange={e => setData(d => ({...d, adaptationMeasures: e.target.value}))} placeholder="Describe measures to make the project resilient to climate change impacts." isRequired />
        <TextareaField id="nccapAlignment" label="Alignment with Kenya's National Climate Change Action Plan (NCCAP)" value={data.nccapAlignment} onChange={e => setData(d => ({...d, nccapAlignment: e.target.value}))} placeholder="Explain how the project aligns with the goals and strategies of the NCCAP." isRequired />
    </div>
);

const SIAForm: React.FC<{data: SIAFormData, setData: React.Dispatch<React.SetStateAction<SIAFormData>>}> = ({ data, setData }) => (
    <div className="space-y-4">
        <TextareaField id="affectedCommunities" label="Affected Communities & Demographics" value={data.affectedCommunities} onChange={e => setData(d => ({...d, affectedCommunities: e.target.value}))} placeholder="Identify the communities and demographic groups that will be affected by the project." isRequired />
        <TextareaField id="potentialSocialImpacts" label="Potential Social Impacts" value={data.potentialSocialImpacts} onChange={e => setData(d => ({...d, potentialSocialImpacts: e.target.value}))} placeholder="Describe potential impacts such as displacement, employment changes, effects on cultural heritage, etc." isRequired />
        <TextareaField id="communityEngagement" label="Community Engagement Plan" value={data.communityEngagementPlan} onChange={e => setData(d => ({...d, communityEngagementPlan: e.target.value}))} placeholder="Outline the plan for ongoing engagement with the affected communities." isRequired />
        <TextareaField id="benefitSharing" label="Benefit Sharing Mechanism" value={data.benefitSharingMechanism} onChange={e => setData(d => ({...d, benefitSharingMechanism: e.target.value}))} placeholder="Describe any plans for sharing project benefits with the local community." isRequired />
    </div>
);

const HIAForm: React.FC<{data: HIAFormData, setData: React.Dispatch<React.SetStateAction<HIAFormData>>}> = ({ data, setData }) => (
    <div className="space-y-4">
        <TextareaField id="healthRisks" label="Potential Health Risks" value={data.potentialHealthRisks} onChange={e => setData(d => ({...d, potentialHealthRisks: e.target.value}))} placeholder="Identify health risks from air/water pollution, occupational hazards, etc." isRequired />
        <TextareaField id="affectedPopulations" label="Affected Population Groups" value={data.affectedPopulationGroups} onChange={e => setData(d => ({...d, affectedPopulationGroups: e.target.value}))} placeholder="Specify which population groups are most vulnerable to the identified health risks." isRequired />
        <TextareaField id="healthSystem" label="Health System Capacity Analysis" value={data.healthSystemCapacity} onChange={e => setData(d => ({...d, healthSystemCapacity: e.target.value}))} placeholder="Analyze the capacity of the local health system to manage potential health impacts." isRequired />
        <TextareaField id="healthMitigation" label="Proposed Health Mitigation Measures" value={data.healthMitigationMeasures} onChange={e => setData(d => ({...d, healthMitigationMeasures: e.target.value}))} placeholder="Outline measures to prevent or mitigate negative health impacts." isRequired />
    </div>
);


export const ManualAssessmentModal: React.FC<ManualAssessmentModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [step, setStep] = useState(1);
    const [projectName, setProjectName] = useState('');
    const [projectLocation, setProjectLocation] = useState('');
    const [assessmentType, setAssessmentType] = useState<AssessmentType>(AssessmentType.EIA);
    
    const [eiaData, setEiaData] = useState<EIAFormData>(initialEiaData);
    const [ciaData, setCiaData] = useState<CIAFormData>(initialCiaData);
    const [siaData, setSiaData] = useState<SIAFormData>(initialSiaData);
    const [hiaData, setHiaData] = useState<HIAFormData>(initialHiaData);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setStep(1);
        setProjectName('');
        setProjectLocation('');
        setAssessmentType(AssessmentType.EIA);
        setEiaData(initialEiaData);
        setCiaData(initialCiaData);
        setSiaData(initialSiaData);
        setHiaData(initialHiaData);
        setError(null);
        setIsLoading(false);
    }
    
    const handleClose = () => {
        resetForm();
        onClose();
    }

    const isFormDataValid = (data: ManualFormData): boolean => {
        const fieldsToValidate = Object.entries(data).filter(([key]) => key !== 'assessmentType');
        return fieldsToValidate.every(([, value]) => typeof value === 'string' && value.trim() !== '');
    };
    
    const currentFormData = useMemo(() => {
        switch (assessmentType) {
            case AssessmentType.EIA: return eiaData;
            case AssessmentType.CIA: return ciaData;
            case AssessmentType.SIA: return siaData;
            case AssessmentType.HIA: return hiaData;
            default: return null;
        }
    }, [assessmentType, eiaData, ciaData, siaData, hiaData]);


    const handleNext = () => {
        if (!projectName.trim() || !projectLocation.trim()) {
            setError('Please fill in all required project details.');
            return;
        }
        setError(null);
        setStep(2);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!currentFormData) {
             setError("Invalid assessment type selected.");
             return;
        }

        if (!isFormDataValid(currentFormData)) {
            setError("Please fill out all required fields in the form.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await onSubmit({ name: projectName, location: projectLocation, assessmentType }, currentFormData);
            resetForm(); 
            // The parent component will close the modal on success.
        } catch (err: any) {
            setError(err.message || 'Failed to create the assessment record. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderFormForType = useMemo(() => {
        switch (assessmentType) {
            case AssessmentType.EIA: return <EIAForm data={eiaData} setData={setEiaData} />;
            case AssessmentType.CIA: return <CIAForm data={ciaData} setData={setCiaData} />;
            case AssessmentType.SIA: return <SIAForm data={siaData} setData={setSiaData} />;
            case AssessmentType.HIA: return <HIAForm data={hiaData} setData={setHiaData} />;
            default: return null;
        }
    }, [assessmentType, eiaData, ciaData, siaData, hiaData]);

    if (!isOpen) return null;
    
    const isStep1Valid = projectName.trim() !== '' && projectLocation.trim() !== '';
    const isStep2Valid = currentFormData ? isFormDataValid(currentFormData) : false;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {step === 1 ? 'Create Manual Assessment Record' : `Manual ${assessmentType}`}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {step === 1 ? 'This creates a record for an assessment performed outside this system.' : `Fill in the details for the ${projectName} project.`}
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="p-6 space-y-4 overflow-y-auto">
                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm" role="alert"><p>{error}</p></div>}
                        
                        {step === 1 ? (
                            <>
                                <div>
                                    <label htmlFor="projectNameManual" className="block text-sm font-medium text-gray-700 mb-1">Project Name<span className="text-red-500 ml-1">*</span></label>
                                    <input id="projectNameManual" type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" required/>
                                </div>
                                <div>
                                    <label htmlFor="projectLocationManual" className="block text-sm font-medium text-gray-700 mb-1">Project Location<span className="text-red-500 ml-1">*</span></label>
                                    <input id="projectLocationManual" type="text" value={projectLocation} onChange={(e) => setProjectLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" required/>
                                </div>
                                <div>
                                    <label htmlFor="assessmentTypeManual" className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                                    <select id="assessmentTypeManual" value={assessmentType} onChange={(e) => setAssessmentType(e.target.value as AssessmentType)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                        {ASSESSMENT_TYPES.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                            renderFormForType
                        )}
                    </div>

                    <div className="p-6 border-t bg-gray-50 flex justify-between gap-3 mt-auto">
                        <Button type="button" variant="secondary" onClick={step === 1 ? handleClose : () => setStep(1)}>
                        {step === 1 ? 'Cancel' : 'Back'}
                        </Button>
                        {step === 1 ? (
                            <Button type="button" onClick={handleNext} disabled={!isStep1Valid}>Next</Button>
                        ) : (
                            <Button type="submit" isLoading={isLoading} disabled={isLoading || !isStep2Valid}>
                                {isLoading ? 'Creating...' : 'Create Record'}
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};