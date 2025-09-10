import { Assessment } from '../types';

const formatText = (text: string): string => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/_(.*?)_/g, '<em>$1</em>'); // Italic
};

const markdownToHtml = (markdownContent: string): string => {
    const lines = markdownContent.split('\n');
    let html = '';
    let listType: 'ul' | 'ol' | null = null;

    for (const line of lines) {
        let isList = false;
        
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('### ')) {
            if (listType) html += `</${listType}>`;
            listType = null;
            html += `<h3>${trimmedLine.substring(4)}</h3>`;
        } else if (trimmedLine.startsWith('## ')) {
            if (listType) html += `</${listType}>`;
            listType = null;
            html += `<h2>${trimmedLine.substring(3)}</h2>`;
        } else if (trimmedLine.startsWith('# ')) {
            if (listType) html += `</${listType}>`;
            listType = null;
            html += `<h1>${trimmedLine.substring(2)}</h1>`;
        } else if (trimmedLine.match(/^\d+\. /)) {
            if (listType !== 'ol') {
                if (listType) html += `</${listType}>`;
                html += '<ol>';
                listType = 'ol';
            }
            const content = trimmedLine.substring(trimmedLine.indexOf('.') + 1).trim();
            html += `<li>${formatText(content)}</li>`;
            isList = true;
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            if (listType !== 'ul') {
                if (listType) html += `</${listType}>`;
                html += '<ul>';
                listType = 'ul';
            }
            const content = trimmedLine.substring(2);
            html += `<li>${formatText(content)}</li>`;
            isList = true;
        } else if (trimmedLine !== '') {
            if (listType && line.startsWith('  ')) { // Handle nested list item content
                 const content = line.trim();
                 html = html.slice(0, -5) + ` ${formatText(content)}</li>`; // Appends to the last li
            } else {
                if (listType) html += `</${listType}>`;
                listType = null;
                html += `<p>${formatText(line)}</p>`;
            }
        }

        if (!isList && listType && trimmedLine === '') {
             if (listType) {
                html += `</${listType}>`;
                listType = null;
            }
        }
    }

    if (listType) {
        html += `</${listType}>`;
    }
    
    return html.replace(/<p><\/p>/g, ''); // remove empty paragraphs
};


export const exportToPdf = (assessment: Assessment) => {
    const fileName = `${assessment.assessmentType}_Assessment_${assessment.projectName.replace(/\s+/g, '_')}.pdf`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Could not open print window. Please disable your pop-up blocker.');
        return;
    }

    const reportHtml = markdownToHtml(assessment.report);

    const assessorHtml = assessment.assessorName
      ? `<p><strong>Prepared By:</strong> ${assessment.assessorName}<em>, ${assessment.assessorType || 'Assessor'}</em></p>`
      : `<p><strong>Prepared By:</strong> _________________________________________</p>`;

    const printContent = `
        <html>
        <head>
            <title>${fileName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                    color: #334155; /* slate-700 */
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                }
                .page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 10mm auto;
                    box-sizing: border-box;
                    page-break-after: always;
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
                }
                .metadata p {
                    margin: 0.5rem 0;
                }
                .report-content h1, .report-content h2, .report-content h3 {
                    color: #14532d;
                    border-bottom: 1px solid #dcfce7; /* brand-green-100 */
                    padding-bottom: 0.5rem;
                    margin-top: 2rem;
                }
                .report-content p, .report-content li {
                    font-size: 1rem;
                }
                .report-content ul, .report-content ol {
                    padding-left: 1.5rem;
                }
                footer {
                    text-align: center;
                    font-size: 0.8rem;
                    color: #94a3b8; /* slate-400 */
                    position: fixed;
                    bottom: 10mm;
                    width: calc(210mm - 40mm);
                }
                 @media print {
                    body, .page {
                        margin: 0;
                        box-shadow: none;
                    }
                    footer {
                        position: fixed;
                        bottom: 10px;
                    }
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
                
                <footer>
                    Report generated by Wajibika Mazingira
                </footer>
            </div>
        </body>
        </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    // Use a timeout to ensure all assets are loaded before printing
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
};