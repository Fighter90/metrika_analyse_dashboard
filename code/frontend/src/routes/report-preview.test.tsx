import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReportSnapshot } from '@pca/shared';
import { renderWithProviders } from '../test/utils';

vi.mock('../lib/api', () => ({ api: { buildSnapshot: vi.fn() } }));
import { api } from '../lib/api';
import { ReportPreviewView, ReportPreview } from './report-preview';

const snapshot: ReportSnapshot = {
  id: 'snap-1',
  generatedAt: 'T',
  period: { from: '2025-01-01', to: '2025-01-07' },
  kpi: { target: 300, b2cApplications: 7, b2bPaidTickets: 20, gap: 280 },
  channels: [],
  hypotheses: { problems: [], solutions: [] },
  decisions: [],
};

describe('ReportPreviewView', () => {
  it('prompts to build when there is no snapshot', () => {
    const onBuild = vi.fn();
    render(<ReportPreviewView snapshot={undefined} isPending={false} onBuild={onBuild} />);
    expect(screen.getByText(/Нажмите «Сформировать snapshot»/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Сформировать snapshot' }));
    expect(onBuild).toHaveBeenCalled();
  });

  it('disables the button while pending', () => {
    render(<ReportPreviewView snapshot={undefined} isPending onBuild={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Формирую…' })).toBeDisabled();
  });

  it('renders the KPI + counts when a snapshot is present', () => {
    render(<ReportPreviewView snapshot={snapshot} isPending={false} onBuild={vi.fn()} />);
    expect(screen.getByText(/snapshot snap-1/)).toBeInTheDocument();
    expect(screen.getByText('Заявки B2C')).toBeInTheDocument();
    expect(screen.getByText('Решений: 0')).toBeInTheDocument();
  });
});

describe('ReportPreview (wrapper)', () => {
  beforeEach(() => vi.mocked(api.buildSnapshot).mockResolvedValue(snapshot));

  it('builds a snapshot on click and shows it', async () => {
    renderWithProviders(<ReportPreview />);
    fireEvent.click(screen.getByRole('button', { name: 'Сформировать snapshot' }));
    expect(await screen.findByText(/snapshot snap-1/)).toBeInTheDocument();
    expect(api.buildSnapshot).toHaveBeenCalled();
  });
});
