import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../components/common/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default classes', () => {
    const { container } = render(<Card><p>Test</p></Card>);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('bg-white');
    expect(cardDiv.className).toContain('rounded-xl');
    expect(cardDiv.className).toContain('shadow-sm');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="extra-class"><p>Test</p></Card>);
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv.className).toContain('extra-class');
  });

  it('renders without className prop', () => {
    const { container } = render(<Card><p>Test</p></Card>);
    expect(container.firstChild).toBeTruthy();
  });
});
