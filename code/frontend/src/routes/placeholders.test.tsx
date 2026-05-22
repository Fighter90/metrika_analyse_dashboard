import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Funnel } from './placeholders';

describe('placeholder pages', () => {
  it('renders the Funnel title', () => {
    render(<Funnel />);
    expect(screen.getByText('Funnel')).toBeInTheDocument();
  });
});
