import { Assessment } from '../types';
import { marked } from 'marked';
import html2pdf from 'html2pdf.js';

export const exportToPdf = (assessment: Assessment) => {
    const fileName = `${assessment.assessmentType}_Assessment_${assessment.projectName.replace(/\s+/g, '_')}.pdf`;
    
    const reportHtml = marked.parse(assessment.report, { gfm: true, breaks: true });

    const assessorHtml = assessment.assessorName
      ? `<p><strong>Prepared By:</strong> ${assessment.assessorName}<em>, ${assessment.assessorType || 'Assessor'}</em></p>`
      : `<p><strong>Prepared By:</strong> _________________________________________</p>`;

    const printContent = `
        <html>
        <head>
            <title>${fileName}</title>
            <style>
                body {
                    font-family: 'Inter', sans-serif;
                    color: #334155; /* slate-700 */
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                }
                .page {
                    padding: 0;
                    margin: 0;
                }
                header {
                    border-bottom: 2px solid #16a34a; /* brand-green-600 */
                    padding-bottom: 1rem;
                    margin-bottom: 1.5rem;
                }
                header h1 {
                    font-size: 1.8rem;
                    color: #14532d; /* brand-green-900 */
                    margin: 0;
                }
                header p {
                    font-size: 1.1rem;
                    color: #166534; /* brand-green-800 */
                    margin: 0.25rem 0 0 0;
                }
                .metadata {
                    background-color: #f1f5f9; /* slate-100 */
                    border: 1px solid #e2e8f0; /* slate-200 */
                    border-radius: 8px;
                    padding: 1rem;
                    margin-bottom: 2rem;
                    page-break-inside: avoid;
                }
                .metadata p {
                    margin: 0.5rem 0;
                }
                .report-content h1, .report-content h2, .report-content h3 {
                    color: #14532d;
                    border-bottom: 1px solid #dcfce7; /* brand-green-100 */
                    padding-bottom: 0.5rem;
                    margin-top: 2rem;
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
                .report-content p, .report-content li {
                    font-size: 1rem;
                }
                .report-content ul, .report-content ol {
                    padding-left: 1.5rem;
                }
            </style>
        </head>
        <body>
            <div class="page">
                <header>
                    <h1>${assessment.assessmentType} Impact Assessment</h1>
                    <p>${assessment.projectName}</p>
                </header>

                <div class="metadata">
                    <p><strong>Project Name:</strong> ${assessment.projectName}</p>
                    <p><strong>Project Proponent:</strong> ${assessment.projectProponent}</p>
                    <p><strong>Location:</strong> ${assessment.location}</p>
                    <p><strong>Project Type:</strong> ${assessment.projectType}</p>
                    <p><strong>Assessment Date:</strong> ${new Date(assessment.createdAt).toLocaleDateString()}</p>
                    ${assessorHtml}
                </div>

                <div class="report-content">
                    ${reportHtml}
                </div>
            </div>
        </body>
        </html>
    `;

    const options = {
      margin: 20, // Margin in mm
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Use html2pdf to generate and save the PDF
    html2pdf().from(printContent).set(options).save();
};