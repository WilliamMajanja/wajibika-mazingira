import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../config/i18n';
import { Footer } from '../components/Footer';

const renderFooter = () =>
  render(
    <I18nProvider>
      <Footer />
    </I18nProvider>
  );

describe('Footer', () => {
  it('renders the footer element', () => {
    const { container } = renderFooter();
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('displays the copyright notice with the current year', () => {
    renderFooter();
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('displays the author name with a link', () => {
    renderFooter();
    const link = screen.getByText('William Majanja');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/WilliamMajanja');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays the technology and storage note', () => {
    renderFooter();
    expect(screen.getByText(/Uhifadhi wa Kaboni/)).toBeInTheDocument();
    expect(screen.getByText(/hifadhiwa ndani/)).toBeInTheDocument();
  });
});
