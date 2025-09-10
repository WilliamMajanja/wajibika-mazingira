import React from 'react';
import type { Page } from '../types';

interface HeaderProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const NavItem: React.FC<{
  label: string;
  page: Page;
  activePage: Page;
  onClick: (page: Page) => void;
  Icon: React.ElementType
}> = ({ label, page, activePage, onClick, Icon }) => {
  const isActive = activePage === page;
  return (
    <button
      onClick={() => onClick(page)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
        isActive
          ? 'bg-brand-green-700 text-white'
          : 'text-brand-green-100 hover:bg-brand-green-800 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline">{label}</span>
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

export const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  return (
    <header className="bg-brand-green-900 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <LogoIcon className="h-8 w-8 sm:h-10 sm:w-10"/>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Wajibika Mazingira</h1>
          </div>
          <nav className="flex space-x-2 bg-brand-green-950/50 p-2 rounded-xl">
            <NavItem label="Impact Assessment" page="assessment" activePage={activePage} onClick={setActivePage} Icon={ClipboardIcon}/>
            <NavItem label="Community Chat" page="chat" activePage={activePage} onClick={setActivePage} Icon={ChatBubbleIcon} />
            <NavItem label="Evidence Locker" page="locker" activePage={activePage} onClick={setActivePage} Icon={LockerIcon} />
          </nav>
        </div>
      </div>
    </header>
  );
};