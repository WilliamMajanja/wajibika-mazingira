/// <reference types="react" />
import * as React from 'react';
import { Header } from './components/Header';
import { AssessmentGenerator } from './components/AssessmentGenerator';
import { CommunityChat } from './components/CommunityChat';
import { EvidenceLocker } from './components/EvidenceLocker';
import { Page } from './types';
import { ToastsProvider } from './hooks/useToasts';
import { ToastContainer } from './components/common/Toast';

function App() {
  const [activePage, setActivePage] = React.useState<Page>('assessment');

  const renderPage = () => {
    switch (activePage) {
      case 'assessment':
        return <AssessmentGenerator />;
      case 'chat':
        return <CommunityChat />;
      case 'locker':
        return <EvidenceLocker />;
      default:
        return <AssessmentGenerator />;
    }
  };

  return (
    <ToastsProvider>
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col h-screen">
          <Header activePage={activePage} setActivePage={setActivePage} />
          <main className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto">
              {renderPage()}
          </main>
          <ToastContainer />
        </div>
    </ToastsProvider>
  );
}

export default App;