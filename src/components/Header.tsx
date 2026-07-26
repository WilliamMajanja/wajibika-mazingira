import * as React from 'react';
import type { Page } from '../types';
import { useAiProvider } from '../contexts/aiProviderLib';
const AiConfigPanel = React.lazy(() => import('./AiConfigPanel').then(m => ({ default: m.AiConfigPanel })));
import { useI18n } from '../config/i18n';

interface HeaderProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  labelKey: string;
  page: Page;
  activePage: Page;
  onClick: (page: Page) => void;
  Icon: React.ElementType
  onHover?: (page: Page) => void;
}> = ({ labelKey, page, activePage, onClick, Icon, onHover }) => {
  const { t } = useI18n();
  const isActive = activePage === page;
  return (
    <button
      onClick={() => onClick(page)}
      onMouseEnter={() => typeof (onHover) === 'function' && onHover(page)}
      onTouchStart={() => typeof (onHover) === 'function' && onHover(page)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap group ${
        isActive
          ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
          : 'text-white hover:bg-white/10 hover:text-white active:bg-white/15'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
      <span className="hidden sm:inline">{t(labelKey)}</span>
    </button>
  );
};

const ClipboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-1.125 0-2.062.938-2.062 2.063v7.5c0 1.125.937 2.063 2.063 2.063h9.75c1.125 0 2.063-.938 2.063-2.063v-7.5c0-1.125-.938-2.063-2.063-2.063H8.25z" /></svg>
);
const ChatBubbleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
);
const LockerIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
);
const LeafIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
);
const ChartIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
);
const GovIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
);
const ZanzibarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
);
const LogoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M100 20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180C144.183 180 180 144.183 180 100C180 55.8172 144.183 20 100 20Z" fill="url(#paint0_linear_1_2)"/>
        <path d="M140 100C140 111.046 131.046 120 120 120C108.954 120 100 111.046 100 100C100 88.9543 108.954 80 120 80C131.046 80 140 88.9543 140 100Z" fill="white" fillOpacity="0.5"/>
        <path d="M100 140C111.046 140 120 131.046 120 120C120 108.954 111.046 100 100 100C88.9543 100 80 108.954 80 120C80 131.046 88.9543 140 100 140Z" fill="white" fillOpacity="0.5"/>
        <path d="M60 100C60 111.046 68.9543 120 80 120C91.0457 120 100 111.046 100 100C100 88.9543 91.0457 80 80 80C68.9543 80 60 88.9543 60 100Z" fill="white" fillOpacity="0.5"/>
        <path d="M100 60C111.046 60 120 68.9543 120 80C120 91.0457 111.046 100 100 100C88.9543 100 80 91.0457 80 80C80 68.9543 88.9543 60 100 60Z" fill="white"/>
        <defs><linearGradient id="paint0_linear_1_2" x1="20" y1="100" x2="180" y2="100" gradientUnits="userSpaceOnUse"><stop stopColor="#15803d"/><stop offset="1" stopColor="#4ade80"/></linearGradient></defs>
    </svg>
);

const PassportIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>
);

const primaryNav: { labelKey: string; page: Page; Icon: React.ElementType }[] = [
  { labelKey: 'nav.passport', page: 'passport', Icon: PassportIcon },
  { labelKey: 'nav.assessment', page: 'assessment', Icon: ClipboardIcon },
  { labelKey: 'nav.carbon', page: 'carbon', Icon: LeafIcon },
  { labelKey: 'nav.market', page: 'market', Icon: ChartIcon },
  { labelKey: 'nav.governance', page: 'governance', Icon: GovIcon },
];

const WalletIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" /></svg>
);

const LegalIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
);

const moreNav: { labelKey: string; page: Page; Icon: React.ElementType }[] = [
  { labelKey: 'nav.wallet', page: 'wallet', Icon: WalletIcon },
  { labelKey: 'nav.zanzibar', page: 'zanzibar', Icon: ZanzibarIcon },
  { labelKey: 'nav.chat', page: 'chat', Icon: ChatBubbleIcon },
  { labelKey: 'nav.locker', page: 'locker', Icon: LockerIcon },
  { labelKey: 'nav.legal', page: 'legal', Icon: LegalIcon },
];

const AiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>
);

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  const { config } = useAiProvider();
  const { t, language, setLanguage } = useI18n();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = React.useState(false);
  const [showAiConfig, setShowAiConfig] = React.useState(false);
  const moreDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const moreActive = moreNav.some(nav => nav.page === activePage);

  const handleNavClick = (page: Page) => {
    setActivePage(page);
    setShowMobileMenu(false);
    setShowMoreDropdown(false);
  };

  // Prefetch likely page bundles on hover/touch to improve perceived navigation speed
  const prefetchPage = (page: Page) => {
    const p = () => {};
    switch (page) {
      case 'passport':
        import('./CarbonPassport').catch(p);
        break;
      case 'assessment':
        import('./AssessmentGenerator').catch(p);
        break;
      case 'chat':
        import('./CommunityChat').catch(p);
        break;
      case 'locker':
        import('./EvidenceLocker').catch(p);
        break;
      case 'carbon':
        import('./CarbonDashboard').catch(p);
        break;
      case 'market':
        import('./CarbonMarket').catch(p);
        break;
      case 'governance':
        import('./GovernancePortal').catch(p);
        break;
      case 'zanzibar':
        import('./ZanzibarShowcase').catch(p);
        break;
      case 'wallet':
        import('./CarbonWallet').catch(p);
        break;
      case 'legal':
        import('./LegalWiki').catch(p);
        break;
      case 'privacy':
        import('./PrivacyPolicy').catch(p);
        break;
      default:
        break;
    }
  };

  return (
    <header className="bg-gradient-to-r from-brand-green-900 via-brand-green-800 to-brand-green-900 shadow-lg sticky top-0 z-40 border-b-2 border-brand-green-700/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 sm:h-28 gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-xl">
              <LogoIcon className="h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0"/>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate drop-shadow-lg">Wajibika Mazingira</h1>
              <p className="text-sm sm:text-base text-green-100 hidden sm:block truncate font-semibold drop-shadow">Conservation Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
             {/* Desktop Navigation */}
             <nav className="hidden lg:flex items-center gap-0.5 bg-white/5 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10 shadow-md">
               {primaryNav.map(nav => (
                 <NavItem key={nav.page} labelKey={nav.labelKey} page={nav.page} activePage={activePage} onClick={handleNavClick} Icon={nav.Icon} onHover={prefetchPage} />
               ))}
                 {/* More Dropdown */}
                 <div className="relative" ref={moreDropdownRef}>
                   <button
                     onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                     className={`flex items-center gap-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap group ${
                       moreActive
                         ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                         : 'text-white hover:bg-white/10 hover:text-white active:bg-white/15'
                     }`}
                     aria-haspopup="true"
                     aria-expanded={showMoreDropdown}
                   >
                     <span>{t('nav.more')}</span>
                     <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 flex-shrink-0 ${showMoreDropdown ? 'rotate-180 group-hover:scale-110' : 'group-hover:scale-110'}`} />
                   </button>
                   {showMoreDropdown && (
                     <div className="absolute right-0 mt-2 w-56 bg-brand-green-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                       {moreNav.map(nav => (
                         <button
                           key={nav.page}
                           onClick={() => handleNavClick(nav.page)}
                           onMouseEnter={() => prefetchPage(nav.page)}
                           onTouchStart={() => prefetchPage(nav.page)}
                           className={`flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold transition-all text-left group/item ${
                             activePage === nav.page
                               ? 'bg-white/20 text-white'
                               : 'text-white hover:bg-white/10 active:bg-white/15'
                           }`}
                           aria-current={activePage === nav.page ? 'page' : undefined}
                         >
                           <nav.Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover/item:scale-110" />
                           {t(nav.labelKey)}
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
            </nav>
             {/* Language Switcher */}
             <button onClick={() => setLanguage(language === 'sw' ? 'en' : 'sw')} className="px-4 py-2.5 text-sm font-bold rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 active:bg-white/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/40 shadow-md group" title={language === 'sw' ? 'Switch to English' : 'Badilisha kwa Kiswahili'}>
               <span className="transition-transform group-hover:scale-110 inline-block">{language === 'sw' ? 'EN' : 'SW'}</span>
             </button>
             {/* AI Config Button */}
             <button onClick={() => setShowAiConfig(true)} className="p-2.5 text-white hover:text-white hover:bg-white/15 backdrop-blur-sm transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 shadow-md group" title={`AI: ${config.type === 'ollama' ? 'Ollama' : 'OpenRouter'}`}>
               <AiIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
             </button>
             {/* Mobile Menu Toggle */}
              <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="lg:hidden p-2.5 text-white hover:bg-white/15 backdrop-blur-sm transition-all duration-300 rounded-lg shadow-md group min-h-[44px] min-w-[44px] items-center justify-center flex" aria-label="Toggle navigation menu" aria-expanded={showMobileMenu}>
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
             </button>
          </div>
        </div>
        {/* Mobile Dropdown Menu */}
        {showMobileMenu && (
          <div className="lg:hidden pb-3 px-2 border-t border-white/10">
            <nav className="flex flex-col gap-1.5 bg-white/5 backdrop-blur-md p-3 rounded-lg mt-3 shadow-md">
              {[...primaryNav, ...moreNav].map(nav => (
                <button key={nav.page} onClick={() => handleNavClick(nav.page)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all group ${
                    activePage === nav.page ? 'bg-white/20 text-white shadow-md' : 'text-white hover:bg-white/10 active:bg-white/15'
                  }`}
                  aria-current={activePage === nav.page ? 'page' : undefined}
                >
                  <nav.Icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
                  {t(nav.labelKey)}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
      {showAiConfig && (
        <React.Suspense fallback={null}>
          <AiConfigPanel onClose={() => setShowAiConfig(false)} />
        </React.Suspense>
      )}
    </header>
  );
};
