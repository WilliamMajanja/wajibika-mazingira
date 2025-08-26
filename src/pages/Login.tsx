import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ScaleIcon } from '../components/icons/ScaleIcon';
import { APP_NAME } from '../constants';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-light p-4">
      <div className="w-full max-w-md mx-auto bg-white shadow-xl rounded-lg p-8 text-center">
        <div className="flex items-center justify-center mb-6">
          <ScaleIcon className="h-12 w-12 text-brand-green" />
          <h1 className="text-3xl font-bold text-brand-dark ml-3">{APP_NAME}</h1>
        </div>
        <p className="text-gray-600 mb-8">
          Your AI-powered assistant for Kenyan Environmental Law. Please sign in or sign up to continue.
        </p>
        
        <div className="flex justify-center h-[44px]">
             <Button onClick={() => login()} isLoading={isLoading} className="w-full max-w-xs text-lg">
                Login / Sign Up
             </Button>
        </div>

        <p className="text-xs text-gray-400 mt-8">
            Secure authentication powered by Auth0.
        </p>
      </div>
       <p className="text-center text-sm text-gray-500 mt-6">
          A Community-Owned Initiative © {new Date().getFullYear()}
       </p>
    </div>
  );
};