
import React from 'react';
import { NavLink } from 'react-router-dom';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { UsersIcon } from './icons/UsersIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { FolderPlusIcon } from './icons/FolderPlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CogIcon } from './icons/CogIcon';
import { useLayout } from '../contexts/LayoutContext';

const NavItem: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => {
    const { closeSidebar } = useLayout();
    
    return (
        <NavLink
            to={to}
            onClick={closeSidebar} // Close sidebar on mobile navigation
            className={({ isActive }) =>
                "flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-md transition-colors duration-200 " +
                (isActive
                    ? "bg-brand-dark-light text-white"
                    : "text-gray-300 hover:bg-brand-dark-light hover:text-white")
            }
        >
            {children}
        </NavLink>
    );
};

export const Sidebar: React.FC = () => {
  const { isSidebarOpen } = useLayout();

  return (
    <div className={`flex flex-col w-64 bg-brand-dark text-white fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-20 border-b border-gray-700 px-4">
            <ScaleIcon className="h-8 w-8 text-brand-green-light flex-shrink-0" />
            <span className="text-white text-xl font-bold ml-2">Wajibika Mazingira</span>
        </div>
        <div className="flex flex-col flex-grow p-4 overflow-y-auto">
            <nav>
                <NavItem to="/dashboard">
                    <GlobeAltIcon className="h-5 w-5 mr-3" />
                    Dashboard
                </NavItem>
                <NavItem to="/new-assessment">
                    <DocumentTextIcon className="h-5 w-5 mr-3" />
                    New Assessment
                </NavItem>
                 <NavItem to="/ai-assistant">
                    <SparklesIcon className="h-5 w-5 mr-3" />
                    AI Assistant
                </NavItem>
                <NavItem to="/evidence-locker">
                    <FolderPlusIcon className="h-5 w-5 mr-3" />
                    Evidence Locker
                </NavItem>
                <NavItem to="/community-forum">
                    <UsersIcon className="h-5 w-5 mr-3" />
                    Community Forum
                </NavItem>
                <NavItem to="/resources">
                    <BookOpenIcon className="h-5 w-5 mr-3" />
                    Legal Resources
                </NavItem>
                <hr className="my-3 border-gray-700" />
                <NavItem to="/settings">
                    <CogIcon className="h-5 w-5 mr-3" />
                    Settings
                </NavItem>
            </nav>
        </div>
        <div className="p-4 border-t border-gray-700">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} Community-Owned Initiative</p>
        </div>
    </div>
  );
};
