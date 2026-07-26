import ReactMarkdown from 'react-markdown';

export default function EvidenceReportViewer({ report }: { report: string }) {
  return (
    <div className="p-6 prose prose-slate max-w-none">
      <ReactMarkdown>{report}</ReactMarkdown>
    </div>
  );
}
