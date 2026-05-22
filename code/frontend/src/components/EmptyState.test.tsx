import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the default message', () => {
    render(<EmptyState />);
    expect(screen.getByRole('status')).toHaveTextContent(/Нет данных за выбранный период/);
  });

  it('renders a custom message', () => {
    render(<EmptyState message="Пусто" />);
    expect(screen.getByRole('status')).toHaveTextContent('Пусто');
  });
});
