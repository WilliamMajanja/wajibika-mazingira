
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLayout } from '../contexts/LayoutContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isSidebarOpen, closeSidebar } = useLayout();
  
  return (
    <div className="relative min-h-screen md:flex bg-brand-light font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
            onClick={closeSidebar}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            aria-hidden="true"
        ></div>
      )}
    </div>
  );
};
