
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogoutIcon } from './icons/LogoutIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CogIcon } from './icons/CogIcon';
import { useLayout } from '../contexts/LayoutContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { title, toggleSidebar } = useLayout();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const userName = user.name || user.email;
  const userAvatar = user.picture;

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="container mx-auto px-6 py-2 flex justify-between items-center">
        <div className="flex items-center">
           <button
              aria-label="Open sidebar"
              onClick={toggleSidebar}
              className="text-gray-600 focus:outline-none md:hidden mr-4"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
           <h1 className="text-xl font-semibold text-gray-700">{title}</h1>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none"
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <span className="text-gray-700 font-medium hidden md:block">{userName}</span>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="User avatar"
                className="h-10 w-10 rounded-full border-2 border-brand-green-light"
              />
            ) : (
              <div className="h-10 w-10 rounded-full border-2 border-brand-green-light bg-brand-dark-light flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5" role="menu">
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Link
                to="/settings"
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setDropdownOpen(false)}
                role="menuitem"
              >
                <CogIcon className="h-5 w-5 mr-3 text-gray-500" />
                Settings
              </Link>
              <button
                onClick={() => logout()}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                <LogoutIcon className="h-5 w-5 mr-3 text-gray-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
