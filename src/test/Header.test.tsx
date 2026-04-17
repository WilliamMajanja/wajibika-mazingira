import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../components/Header';
import { ToastsProvider } from '../hooks/useToasts';
import { usePiAuth } from '../contexts/PiAuthContext';

// Mock the PiAuthContext
vi.mock('../contexts/PiAuthContext', () => ({
  usePiAuth: vi.fn(() => ({
    user: null,
    sdkAvailable: false,
    isAuthenticating: false,
    login: vi.fn(),
    logout: vi.fn(),
    accessToken: null,
  })),
}));

const mockedUsePiAuth = vi.mocked(usePiAuth);

const renderHeader = (activePage: 'assessment' | 'chat' | 'locker' = 'assessment') => {
  const setActivePage = vi.fn();
  const result = render(
    <ToastsProvider>
      <Header activePage={activePage} setActivePage={setActivePage} />
    </ToastsProvider>
  );
  return { ...result, setActivePage };
};

describe('Header', () => {
  it('renders the app title', () => {
    renderHeader();
    expect(screen.getByText('Wajibika Mazingira')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    renderHeader();
    expect(screen.getByText('Impact Assessment')).toBeInTheDocument();
    expect(screen.getByText('Community Chat')).toBeInTheDocument();
    expect(screen.getByText('Evidence Locker')).toBeInTheDocument();
  });

  it('marks the active page with aria-current', () => {
    renderHeader('chat');
    const chatButton = screen.getByText('Community Chat').closest('button');
    expect(chatButton).toHaveAttribute('aria-current', 'page');

    const assessmentButton = screen.getByText('Impact Assessment').closest('button');
    expect(assessmentButton).not.toHaveAttribute('aria-current');
  });

  it('calls setActivePage when clicking a nav item', async () => {
    const user = userEvent.setup();
    const { setActivePage } = renderHeader('assessment');
    
    await user.click(screen.getByText('Community Chat'));
    expect(setActivePage).toHaveBeenCalledWith('chat');
  });

  it('does not show Pi auth buttons when SDK is unavailable', () => {
    renderHeader();
    expect(screen.queryByText('Sign in with Pi')).not.toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });
});

describe('Header with Pi SDK available', () => {
  beforeEach(() => {
    mockedUsePiAuth.mockReturnValue({
      user: null,
      sdkAvailable: true,
      isAuthenticating: false,
      login: vi.fn(),
      logout: vi.fn(),
      accessToken: null,
    });
  });

  it('shows sign-in button when SDK is available and user is not logged in', () => {
    renderHeader();
    expect(screen.getByText('Sign in with Pi')).toBeInTheDocument();
  });

  it('shows username and sign-out when user is logged in', () => {
    mockedUsePiAuth.mockReturnValue({
      user: { uid: '123', username: 'testpioneer' },
      sdkAvailable: true,
      isAuthenticating: false,
      login: vi.fn(),
      logout: vi.fn(),
      accessToken: 'token-123',
    });

    renderHeader();
    expect(screen.getByText('@testpioneer')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows connecting state during authentication', () => {
    mockedUsePiAuth.mockReturnValue({
      user: null,
      sdkAvailable: true,
      isAuthenticating: true,
      login: vi.fn(),
      logout: vi.fn(),
      accessToken: null,
    });

    renderHeader();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
  });
});
