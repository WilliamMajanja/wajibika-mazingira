import React, { useEffect } from 'react';
import { CogIcon } from '../components/icons/CogIcon';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';

export const Settings: React.FC = () => {
    const { setTitle } = useLayout();
    const { user } = useAuth();

    useEffect(() => {
        setTitle('Settings');
    }, [setTitle]);
    
    return (
        <div>
            <div className="flex items-center mb-6">
                <CogIcon className="h-8 w-8 text-brand-green-light" />
                <h2 className="text-3xl font-bold text-gray-800 ml-3">Settings</h2>
            </div>

            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800">Account Information</h3>
                <div className="mt-4 space-y-2 text-gray-700">
                  <p><strong>Name:</strong> {user?.name}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                </div>
                <p className="text-gray-500 mt-4 text-sm">
                    To manage your password or other profile details, please visit the provider you used to sign in. Account management is handled externally for your security.
                </p>
                
                <hr className="my-6" />

                <h3 className="text-xl font-bold text-gray-800">Application Configuration</h3>
                <div className="mt-4 bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                    <p className="font-bold">Database & AI Status</p>
                    <p>The application's features are enabled and powered by system-wide credentials for Neon Database and Google AI.</p>
                </div>

                 <div className="mt-6 text-gray-500 text-sm">
                    <p>If you are the administrator, please ensure the `DATABASE_URL` and `API_KEY` environment variables are configured in your hosting provider's settings (e.g., Netlify) to enable all features.</p>
                </div>
            </div>
        </div>
    );
};
