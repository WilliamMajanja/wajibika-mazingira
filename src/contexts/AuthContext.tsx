
import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { Auth0Provider, useAuth0, AppState, User, RedirectLoginOptions } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import { ROLES_CLAIM } from '../constants';

// Auth0 configuration is loaded from environment variables.
// These must be set in your project's hosting environment (e.g., Netlify).
// For local development, create a .env file with VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE.
const AUTH0_DOMAIN = (import.meta as any).env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = (import.meta as any).env.VITE_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE = (import.meta as any).env.VITE_AUTH0_AUDIENCE;

interface AuthContextType {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (options?: RedirectLoginOptions) => void;
  logout: () => void;
  getAccessToken: () => Promise<string>;
  roles: string[];
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || window.location.pathname, { replace: true });
  };
  
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return (
        <div className="flex items-center justify-center h-screen bg-brand-light text-red-700 p-8">
           <div className="text-center">
                <h1 className="text-2xl font-bold">Auth0 Configuration Error</h1>
                <p className="mt-2">The Auth0 Domain and Client ID are not configured.</p>
                <p className="mt-1 text-sm text-gray-600">Please have an administrator set them up to enable authentication.</p>
           </div>
        </div>
    );
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_AUDIENCE,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      <AuthContextualProvider>
          {children}
      </AuthContextualProvider>
    </Auth0Provider>
  );
};

const AuthContextualProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { 
        user, 
        isLoading, 
        isAuthenticated, 
        loginWithRedirect, 
        logout: auth0Logout, 
        getAccessTokenSilently 
    } = useAuth0();

    const roles = useMemo(() => {
        if (user && user[ROLES_CLAIM]) {
            return (user[ROLES_CLAIM] as string[]) || [];
        }
        return [];
    }, [user]);

    const hasRole = useCallback((requiredRoles: string | string[]): boolean => {
        if (!isAuthenticated) return false;
        const rolesToCheck = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        return roles.some(role => rolesToCheck.includes(role));
    }, [isAuthenticated, roles]);

    const login = useCallback((options?: RedirectLoginOptions) => {
        loginWithRedirect({
            ...options,
            authorizationParams: {
                ...options?.authorizationParams,
                prompt: 'select_account',
            }
        });
    }, [loginWithRedirect]);

    const logout = useCallback(() => {
        auth0Logout({ 
            logoutParams: { 
                returnTo: window.location.origin,
                federated: true
            } 
        });
    }, [auth0Logout]);

    const getAccessToken = useCallback(async (): Promise<string> => {
        try {
            return await getAccessTokenSilently();
        } catch (e) {
            console.error("Error getting access token", e);
            return "";
        }
    }, [getAccessTokenSilently]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        getAccessToken,
        roles,
        hasRole,
    };
    
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};