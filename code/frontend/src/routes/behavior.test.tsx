import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PageStat } from '@pca/shared';
import { renderWithProviders } from '../test/utils';

vi.mock('../lib/api', () => ({ api: { pages: vi.fn() } }));
import { api } from '../lib/api';
import { BehaviorView, Behavior } from './behavior';

const pages = api.pages as unknown as ReturnType<typeof vi.fn>;

const page = (over: Partial<PageStat>): PageStat => ({
  date: '2025-01-01',
  page: '/lp',
  visits: 10,
  users: 9,
  bounceRate: 0.2,
  goalReaches: 1,
  conversionRate: 0.1,
  ...over,
});

beforeEach(() => pages.mockReset());

describe('BehaviorView', () => {
  it('renders loading and error states', () => {
    const { rerender } = render(<BehaviorView status="pending" stats={[]} />);
    expect(screen.getByText('Загрузка…')).toBeInTheDocument();
    rerender(<BehaviorView status="error" stats={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders the entry-page table on success', () => {
    render(<BehaviorView status="success" stats={[page({ page: '/lp' })]} />);
    expect(screen.getByRole('heading', { name: 'Страницы входа' })).toBeInTheDocument();
    expect(screen.getByText('/lp')).toBeInTheDocument();
  });
});

describe('Behavior (data wrapper)', () => {
  it('renders the table after the query resolves', async () => {
    pages.mockResolvedValue([page({})]);
    renderWithProviders(<Behavior />);
    expect(await screen.findByRole('heading', { name: 'Страницы входа' })).toBeInTheDocument();
  });
});
