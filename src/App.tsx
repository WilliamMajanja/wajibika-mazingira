import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AssessmentProvider } from './contexts/AssessmentContext';
import { MainLayout } from './components/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewAssessment } from './pages/NewAssessment';
import { CommunityForum } from './pages/CommunityForum';
import { Resources } from './pages/Resources';
import { AssessmentDetail } from './pages/AssessmentDetail';
import { EvidenceLocker } from './pages/EvidenceLocker';
import { AiAssistant } from './pages/AiAssistant';
import { Settings } from './pages/Settings';
import { EvidenceProvider } from './contexts/EvidenceContext';
import { ForumProvider } from './contexts/ForumContext';
import { ForumThreadPage } from './pages/ForumThreadPage';
import { LayoutProvider } from './contexts/LayoutContext';

const AppProviders: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <AssessmentProvider>
      <EvidenceProvider>
        <ForumProvider>
           <LayoutProvider>
              {children}
            </LayoutProvider>
        </ForumProvider>
      </EvidenceProvider>
    </AssessmentProvider>
);


const AppContent: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
     return (
        <div className="flex items-center justify-center h-screen bg-brand-light">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-green"></div>
        </div>
      );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppProviders>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-assessment" element={<NewAssessment />} />
          <Route path="/assessment/:id" element={<AssessmentDetail />} />
          <Route path="/evidence-locker" element={<EvidenceLocker />} />
          <Route path="/community-forum/:threadId" element={<ForumThreadPage />} />
          <Route path="/community-forum" element={<CommunityForum />} />
          <Route path="/ai-assistant" element={<AiAssistant />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </MainLayout>
    </AppProviders>
  );
};


function App() {
  return (
    <AppContent />
  );
}

export default App;