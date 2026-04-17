import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../components/Footer';

describe('Footer', () => {
  it('renders the footer element', () => {
    const { container } = render(<Footer />);
    const footer = container.querySelector('footer');
    expect(footer).toBeInTheDocument();
  });

  it('displays the copyright notice with the current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('displays the author name with a link', () => {
    render(<Footer />);
    const link = screen.getByText('William Majanja');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/WilliamMajanja');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays the technology and storage note', () => {
    render(<Footer />);
    expect(screen.getByText(/Powered by Google Gemini/)).toBeInTheDocument();
    expect(screen.getByText(/All data stored locally/)).toBeInTheDocument();
  });
});
