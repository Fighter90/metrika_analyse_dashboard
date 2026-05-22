import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ChannelStat } from '@pca/shared';
import { renderWithProviders } from '../test/utils';

vi.mock('../lib/api', () => ({ api: { channels: vi.fn() } }));
import { api } from '../lib/api';
import { TrendsView, Trends } from './trends';

const channels = api.channels as unknown as ReturnType<typeof vi.fn>;

const stat = (date: string, over: Partial<ChannelStat> = {}): ChannelStat => ({
  date,
  channel: 'podcast',
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  visits: 10,
  users: 9,
  bounceRate: 0.2,
  avgDuration: 60,
  goalReaches: 1,
  conversionRate: 0.1,
  ...over,
});

beforeEach(() => channels.mockReset());

describe('TrendsView', () => {
  it('renders loading and error states', () => {
    const { rerender } = render(<TrendsView status="pending" stats={[]} />);
    expect(screen.getByText('Загрузка…')).toBeInTheDocument();
    rerender(<TrendsView status="error" stats={[]} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('shows an empty state when there is no data', () => {
    render(<TrendsView status="success" stats={[]} />);
    expect(screen.getByText(/Нет данных за выбранный период/)).toBeInTheDocument();
  });

  it('renders WoW stats (up + down arrows) and the chart on success', () => {
    // current week visits drop vs previous → visits delta negative (▼); reaches rise → ▲.
    const stats: ChannelStat[] = [];
    for (let d = 1; d <= 7; d += 1) {
      stats.push(stat(`2025-01-${String(d).padStart(2, '0')}`, { visits: 20, goalReaches: 1 }));
    }
    for (let d = 8; d <= 14; d += 1) {
      stats.push(stat(`2025-01-${String(d).padStart(2, '0')}`, { visits: 10, goalReaches: 3 }));
    }
    render(<TrendsView status="success" stats={stats} />);
    expect(screen.getByText('Динамика по дням')).toBeInTheDocument();
    expect(screen.getByText('Визиты (7 дней)')).toBeInTheDocument();
    expect(screen.getByTestId('echart')).toBeInTheDocument();
    expect(screen.getByText(/▼/)).toBeInTheDocument(); // visits fell
    expect(screen.getByText(/▲/)).toBeInTheDocument(); // reaches rose
  });
});

describe('Trends (data wrapper)', () => {
  it('renders the chart after the query resolves', async () => {
    channels.mockResolvedValue([stat('2025-01-01')]);
    renderWithProviders(<Trends />);
    expect(await screen.findByText('Динамика по дням')).toBeInTheDocument();
  });
});
