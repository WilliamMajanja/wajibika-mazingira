import * as React from 'react';
import { Header } from './components/Header';
import { SkeletonCard } from './components/common/Skeleton';
import { useStorageWarning } from './hooks/useLocalStorage';
import { useToasts } from './hooks/useToasts';
const CarbonPassportComponent = React.lazy(() => import('./components/CarbonPassport').then(m => ({ default: m.CarbonPassportComponent })));
const AssessmentGenerator = React.lazy(() => import('./components/AssessmentGenerator').then(m => ({ default: m.AssessmentGenerator })));
const CommunityChat = React.lazy(() => import('./components/CommunityChat').then(m => ({ default: m.CommunityChat })));
const EvidenceLocker = React.lazy(() => import('./components/EvidenceLocker').then(m => ({ default: m.EvidenceLocker })));
const CarbonDashboard = React.lazy(() => import('./components/CarbonDashboard').then(m => ({ default: m.CarbonDashboard })));
const CarbonMarket = React.lazy(() => import('./components/CarbonMarket').then(m => ({ default: m.CarbonMarket })));
const GovernancePortal = React.lazy(() => import('./components/GovernancePortal').then(m => ({ default: m.GovernancePortal })));
const ZanzibarShowcase = React.lazy(() => import('./components/ZanzibarShowcase').then(m => ({ default: m.ZanzibarShowcase })));
const CarbonWallet = React.lazy(() => import('./components/CarbonWallet').then(m => ({ default: m.CarbonWallet })));
const LegalWiki = React.lazy(() => import('./components/LegalWiki').then(m => ({ default: m.LegalWiki })));
const PrivacyPolicy = React.lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
import { Footer } from './components/Footer';
import { Page } from './types';
import { ToastsProvider } from './components/ToastsProvider';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AiProviderContext } from './contexts/AiProviderContext';
import { I18nProvider } from './config/i18n';

const pageComponents: Record<Page, React.ComponentType<object>> = {
  passport: CarbonPassportComponent,
  assessment: AssessmentGenerator,
  chat: CommunityChat,
  locker: EvidenceLocker,
  carbon: CarbonDashboard,
  market: CarbonMarket,
  governance: GovernancePortal,
  zanzibar: ZanzibarShowcase,
  wallet: CarbonWallet,
  legal: LegalWiki,
  privacy: PrivacyPolicy,
};

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '') as Page;
  if (hash && hash in pageComponents) return hash;
  return 'assessment';
}

function PageLoader() {
  return (
    <div className="space-y-6" aria-label="Loading page">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard />
    </div>
  );
}

function StorageWarningListener() {
  const { addToast } = useToasts();
  const handleWarning = React.useCallback((message: string) => {
    addToast({ type: 'error', message });
  }, [addToast]);
  useStorageWarning(handleWarning);
  return null;
}

function App() {
  const [activePage, setActivePage] = React.useState<Page>(getPageFromHash);

  const handleSetPage = React.useCallback((page: Page) => {
    window.location.hash = page;
  }, []);

  React.useEffect(() => {
    const handleHashChange = () => {
      const page = getPageFromHash();
      setActivePage(page);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const PageComponent = pageComponents[activePage];

  return (
    <ErrorBoundary>
      <AiProviderContext>
          <ToastsProvider>
            <I18nProvider>
              <div className="bg-slate-100 min-h-[100dvh] font-sans text-slate-800 flex flex-col">
                <StorageWarningListener />
                <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-green-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
                  Skip to main content
                </a>
                <Header activePage={activePage} setActivePage={handleSetPage} />
                <main id="main-content" className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
                  <ErrorBoundary resetKey={activePage}>
                    <React.Suspense fallback={<PageLoader />}>
                      <PageComponent />
                    </React.Suspense>
                  </ErrorBoundary>
                </main>
                <Footer onNavigate={handleSetPage} />
                <ToastContainer />
              </div>
            </I18nProvider>
          </ToastsProvider>
        </AiProviderContext>
    </ErrorBoundary>
  );
}

export default App;
