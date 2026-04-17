
import * as React from 'react';
import { Header } from './components/Header';
import { AssessmentGenerator } from './components/AssessmentGenerator';
import { CommunityChat } from './components/CommunityChat';
import { EvidenceLocker } from './components/EvidenceLocker';
import { Footer } from './components/Footer';
import { Page } from './types';
import { ToastsProvider } from './hooks/useToasts';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PiAuthProvider } from './contexts/PiAuthContext';

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
    <PiAuthProvider>
      <ToastsProvider>
          <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col h-screen">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-green-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
              Skip to main content
            </a>
            <Header activePage={activePage} setActivePage={setActivePage} />
            <main id="main-content" className="container mx-auto p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto">
              <ErrorBoundary>
                {renderPage()}
              </ErrorBoundary>
            </main>
            <Footer />
            <ToastContainer />
          </div>
      </ToastsProvider>
    </PiAuthProvider>
  );
}

export default App;
