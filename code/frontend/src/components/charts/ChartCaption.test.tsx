import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartCaption } from './ChartCaption';

describe('ChartCaption', () => {
  it('renders correct and advice, and shows the caveat row when provided', () => {
    render(
      <ChartCaption correct="визиты из БД" caveat="UTM не размечены" advice="размечайте UTM" />,
    );
    expect(screen.getByText('визиты из БД')).toBeInTheDocument();
    expect(screen.getByText('UTM не размечены')).toBeInTheDocument();
    expect(screen.getByText('размечайте UTM')).toBeInTheDocument();
    expect(screen.getByText('🔴 Внимание')).toBeInTheDocument();
  });

  it('omits the caveat row when no caveat is given', () => {
    render(<ChartCaption correct="данные корректны" advice="продолжайте" />);
    expect(screen.getByText('данные корректны')).toBeInTheDocument();
    expect(screen.getByText('продолжайте')).toBeInTheDocument();
    expect(screen.queryByText('🔴 Внимание')).not.toBeInTheDocument();
  });
});
