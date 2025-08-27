import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Assessment, ManualFormData, AssessmentType, EIAFormData, CIAFormData, SIAFormData, HIAFormData, Evidence, ForumThread } from '../types';
import { useAssessments } from '../contexts/AssessmentContext';
import { useLayout } from '../contexts/LayoutContext';
import { useEvidence } from '../contexts/EvidenceContext';
import { useForum } from '../contexts/ForumContext';
import { Button } from '../components/common/Button';
import { ArrowDownTrayIcon } from '../components/icons/ArrowDownTrayIcon';
import { EvidenceCard } from '../components/EvidenceCard';
import { ForumThreadCard } from '../components/ForumThreadCard';
import { Spinner } from '../components/common/Spinner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
    <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4 border-gray-200">{title}</h3>
    {children}
  </div>
);

const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const ManualFormDataDisplay: React.FC<{ data: ManualFormData }> = ({ data }) => {
    const renderField = (label: string, value: string) => (
        <div key={label} className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 border-b last:border-b-0 border-gray-100">
            <dt className="text-sm font-semibold text-gray-600">{label}</dt>
            <dd className="mt-1 text-sm text-gray-800 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{value || <span className="italic text-gray-400">Not provided</span>}</dd>
        </div>
    );

    let fields: {label: string, value: string}[] = [];
    const { assessmentType } = data;

    if (assessmentType === AssessmentType.EIA) {
        const eiaData = data as EIAFormData;
        fields = [
            { label: 'Environmental Setting', value: eiaData.environmentalSetting },
            { label: 'Potential Environmental Impacts', value: eiaData.potentialImpacts },
            { label: 'Proposed Mitigation Measures', value: eiaData.mitigationMeasures },
            { label: 'Public Consultation Summary', value: eiaData.publicConsultationSummary },
        ];
    } else if (assessmentType === AssessmentType.CIA) {
        const ciaData = data as CIAFormData;
        fields = [
            { label: 'GHG Emissions Estimate', value: ciaData.ghgEmissionsEstimate },
            { label: 'Vulnerability to Climate Change', value: ciaData.climateVulnerability },
            { label: 'Proposed Adaptation Measures', value: ciaData.adaptationMeasures },
            { label: 'Alignment with NCCAP', value: ciaData.nccapAlignment },
        ];
    } else if (assessmentType === AssessmentType.SIA) {
        const siaData = data as SIAFormData;
        fields = [
            { label: 'Affected Communities/Demographics', value: siaData.affectedCommunities },
            { label: 'Potential Social Impacts', value: siaData.potentialSocialImpacts },
            { label: 'Community Engagement Plan', value: siaData.communityEngagementPlan },
            { label: 'Benefit Sharing Mechanism', value: siaData.benefitSharingMechanism },
        ];
    } else if (assessmentType === AssessmentType.HIA) {
        const hiaData = data as HIAFormData;
        fields = [
            { label: 'Potential Health Risks', value: hiaData.potentialHealthRisks },
            { label: 'Affected Population Groups', value: hiaData.affectedPopulationGroups },
            { label: 'Health System Capacity Analysis', value: hiaData.healthSystemCapacity },
            { label: 'Proposed Health Mitigation Measures', value: hiaData.healthMitigationMeasures },
        ];
    }

    return (
        <dl>
            {fields.map(field => renderField(field.label, field.value))}
        </dl>
    )
}


export const AssessmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getAssessmentById, isLoading: isAssessmentLoading } = useAssessments();
  const { getEvidenceForAssessment, isLoading: isEvidenceLoading } = useEvidence();
  const { getThreadsForAssessment, isLoading: isForumLoading, createThread } = useForum();
  const { setTitle } = useLayout();
  
  const [assessment, setAssessment] = useState<Assessment | null | undefined>(undefined);
  const [attachedEvidence, setAttachedEvidence] = useState<Evidence[]>([]);
  const [relatedThreads, setRelatedThreads] = useState<ForumThread[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!isAssessmentLoading && id) {
      const currentAssessment = getAssessmentById(id);
      setAssessment(currentAssessment);
      if (currentAssessment) {
        setTitle(currentAssessment.project_name);
        getEvidenceForAssessment(id).then(setAttachedEvidence);
        getThreadsForAssessment(id).then(setRelatedThreads);
      } else {
        setTitle('Assessment Not Found');
      }
    }
  }, [id, getAssessmentById, isAssessmentLoading, setTitle, getEvidenceForAssessment, getThreadsForAssessment]);

  const handleDownloadPdf = () => {
    if (!assessment || assessment.type === 'Manual') return;
    const reportContentElement = document.getElementById('assessment-report-content');
    if (reportContentElement) {
        setIsDownloading(true);
        html2canvas(reportContentElement, { scale: 2, useCORS: true, logging: false })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4',
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const ratio = canvasWidth / canvasHeight;
                const newCanvasHeight = pdfWidth / ratio;
                let heightLeft = newCanvasHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, newCanvasHeight);
                heightLeft -= pdfHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - newCanvasHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, newCanvasHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`${assessment.project_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_assessment.pdf`);
            })
            .catch(err => {
                console.error("Error generating PDF:", err);
                alert("Sorry, there was an error generating the PDF report.");
            })
            .finally(() => setIsDownloading(false));
    }
  };

  const handleStartDiscussion = async () => {
    if (!assessment) return;
    const title = prompt("Enter a title for the new discussion about this assessment:", `Discussion: ${assessment.project_name}`);
    if(title) {
        const content = prompt("Enter the first message for this discussion:");
        if (content) {
            await createThread(title, content, assessment.id);
            // Refresh threads
            getThreadsForAssessment(assessment.id).then(setRelatedThreads);
        }
    }
  };


  if (isAssessmentLoading || assessment === undefined) {
    return (
      <div className="text-center py-12">
        <h4 className="text-lg font-medium text-gray-700">Loading assessment details...</h4>
      </div>
    );
  }

  if (!assessment) {
    return <Navigate to="/dashboard" />;
  }

  const { type, report, project_name, location, date, manual_form } = assessment;

  // Manual Assessment View
  if (type === 'Manual') {
    return (
        <div>
            {/* Same header as before */}
            <Section title="Manual Assessment Form Details">
                {manual_form ? <ManualFormDataDisplay data={manual_form} /> : <p className="text-gray-500">No detailed form data was submitted for this manual record.</p>}
            </Section>
            {/* Attached Evidence and Forum sections for manual assessments too */}
        </div>
    );
  }

  // AI Assessment View
  return (
    <div>
        <div id="assessment-report-content" className="bg-brand-light p-4">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">{report.assessmentTitle}</h2>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Project: <span className="font-medium text-gray-700">{project_name}</span></span>
                        <span>Location: <span className="font-medium text-gray-700">{location}</span></span>
                        <span>Date: <span className="font-medium text-gray-700">{new Date(date).toLocaleDateString()}</span></span>
                    </div>
                </div>
                 <Button onClick={handleDownloadPdf} variant="secondary" disabled={isDownloading} isLoading={isDownloading}>
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                </Button>
            </div>

            <Section title="Project Summary">
                <p className="text-gray-600 leading-relaxed">{report.projectSummary}</p>
            </Section>
            
            <Section title="Applicable Legal Framework (Kenya)">
                <ul className="space-y-4">
                    {report.legalFramework?.map((item, index) => (
                        <li key={index} className="p-4 bg-gray-50 rounded-md border border-gray-200">
                            <p className="font-semibold text-gray-800">{item.statute}</p>
                            <p className="text-gray-600 mt-1">{item.relevance}</p>
                        </li>
                    ))}
                </ul>
            </Section>
            
            <Section title="Potential Impacts">
                <div className="space-y-4">
                    {report.potentialImpacts?.map((impact, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                               <h4 className="font-semibold text-gray-800">{impact.impactArea}</h4>
                               <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(impact.severity)}`}>
                                   {impact.severity}
                               </span>
                            </div>
                            <p className="text-gray-600 mt-2">{impact.description}</p>
                        </div>
                    ))}
                </div>
            </Section>
            
            <Section title="Proposed Mitigation Measures">
                <ul className="list-disc list-inside space-y-3 text-gray-600">
                    {report.mitigationMeasures?.map((item, index) => (
                        <li key={index}>
                            <span className="font-semibold text-gray-700">{item.measure}:</span> {item.implementation}
                        </li>
                    ))}
                </ul>
            </Section>

            <Section title="Stakeholder Engagement Plan">
                <p className="text-gray-600 leading-relaxed">{report.stakeholderEngagementPlan}</p>
            </Section>

            <Section title="Recommendations">
                <p className="text-gray-600 leading-relaxed font-medium">{report.recommendations}</p>
            </Section>
        </div>

        <div className="mt-8">
          <Section title="Attached Evidence">
              {isEvidenceLoading ? <Spinner /> : attachedEvidence.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {attachedEvidence.map(item => <EvidenceCard key={item.id} evidence={item} />)}
                  </div>
              ) : <p className="text-gray-500">No evidence was attached to this assessment.</p>}
          </Section>
        </div>
        
        <div className="mt-8">
            <Section title="Community Discussion">
              {isForumLoading ? <Spinner /> : relatedThreads.length > 0 ? (
                  <div className="space-y-4">
                      {relatedThreads.map(thread => <ForumThreadCard key={thread.id} thread={thread} />)}
                  </div>
              ) : <p className="text-gray-500">No discussions have been started for this assessment yet.</p>}
              <div className="text-center mt-6">
                  <Button onClick={handleStartDiscussion}>Start a Discussion</Button>
              </div>
            </Section>
        </div>


        <div className="text-center mt-8">
            <Link to="/dashboard" className="text-brand-green-light hover:text-brand-green font-semibold">
                &larr; Back to Dashboard
            </Link>
        </div>
    </div>
  );
};