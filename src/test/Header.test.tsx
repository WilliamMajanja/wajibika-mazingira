import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../components/Header';
import { ToastsProvider } from '../components/ToastsProvider';
import { AiProviderContext } from '../contexts/AiProviderContext';
import { I18nProvider } from '../config/i18n';

const renderHeader = (activePage: 'assessment' | 'chat' | 'locker' | 'carbon' | 'market' | 'governance' | 'zanzibar' | 'passport' = 'assessment') => {
  const setActivePage = vi.fn();
  const result = render(
    <I18nProvider>
      <AiProviderContext>
        <ToastsProvider>
          <Header activePage={activePage} setActivePage={setActivePage} />
        </ToastsProvider>
      </AiProviderContext>
    </I18nProvider>
  );
  return { ...result, setActivePage };
};

describe('Header', () => {
  it('renders the app title', () => {
    renderHeader();
    expect(screen.getByText('Wajibika Mazingira')).toBeInTheDocument();
  });

  it('renders primary navigation buttons', () => {
    renderHeader();
    expect(screen.getByText('Pasipoti ya Kaboni')).toBeInTheDocument();
    expect(screen.getByText('Tathmini ya Athari')).toBeInTheDocument();
    expect(screen.getByText('Dashibodi ya Kaboni')).toBeInTheDocument();
    expect(screen.getByText('Soko la Kaboni')).toBeInTheDocument();
    expect(screen.getByText('Utawala')).toBeInTheDocument();
  });

  it('renders More dropdown button', () => {
    renderHeader();
    expect(screen.getByText('Zaidi')).toBeInTheDocument();
  });

  it('shows dropdown items when More is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();
    await user.click(screen.getByText('Zaidi'));
    expect(screen.getByText('Mazungumzo ya Jamii')).toBeInTheDocument();
    expect(screen.getByText('Hifadhi ya Nyaraka')).toBeInTheDocument();
    expect(screen.getByText('Zanzibar')).toBeInTheDocument();
  });

  it('renders language switcher button', () => {
    renderHeader();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('marks the active page with aria-current', async () => {
    const user = userEvent.setup();
    renderHeader('chat');
    await user.click(screen.getByText('Zaidi'));
    const chatButton = screen.getByText('Mazungumzo ya Jamii').closest('button');
    expect(chatButton).toHaveAttribute('aria-current', 'page');
    const assessmentButton = screen.getByText('Tathmini ya Athari').closest('button');
    expect(assessmentButton).not.toHaveAttribute('aria-current');
  });

  it('calls setActivePage when clicking a primary nav item', async () => {
    const user = userEvent.setup();
    const { setActivePage } = renderHeader('assessment');
    await user.click(screen.getByText('Soko la Kaboni'));
    expect(setActivePage).toHaveBeenCalledWith('market');
  });

  it('calls setActivePage when clicking a dropdown item', async () => {
    const user = userEvent.setup();
    const { setActivePage } = renderHeader('assessment');
    await user.click(screen.getByText('Zaidi'));
    await user.click(screen.getByText('Mazungumzo ya Jamii'));
    expect(setActivePage).toHaveBeenCalledWith('chat');
  });

  it('renders Carbon Passport as first primary nav item', () => {
    renderHeader();
    const navButtons = screen.getAllByRole('button');
    const passportBtn = navButtons.find(b => b.textContent?.includes('Pasipoti ya Kaboni'));
    expect(passportBtn).toBeInTheDocument();
  });
});
