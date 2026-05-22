import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Decision, Hypothesis } from '@pca/shared';
import { renderWithProviders } from '../test/utils';

vi.mock('../lib/api', () => ({
  api: { decisions: vi.fn(), hypotheses: vi.fn(), createDecision: vi.fn() },
}));
import { api } from '../lib/api';
import { DecisionEditor, DecisionsView, Decisions } from './decisions';

const hyp: Hypothesis = {
  id: 1,
  diamondPhase: 'define',
  kind: 'problem',
  subject: 's',
  action: 'a',
  solution: 'sol',
  condition: 'c',
  title: 'Подкаст → конверсия',
  hiddenAssumptions: [
    { category: 'behavior', text: 'b' },
    { category: 'market', text: 'm' },
    { category: 'tech', text: 't' },
  ],
  validationMethods: [
    { type: 'quantitative', plan: 'q' },
    { type: 'synthetic', plan: 's' },
  ],
  impact: 8,
  confidence: 6,
  ease: 7,
  impactRationale: 'r',
  confidenceRationale: 'r',
  easeRationale: 'r',
  iceScore: 336,
  greenCriteria: 'g',
  yellowCriteria: 'y',
  redCriteria: 'r',
  deadlineDays: 5,
  deadlineAt: '2999-01-01T00:00:00.000Z',
  status: 'draft',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const decision: Decision = {
  id: 10,
  number: 'DL-001',
  hypothesisId: 1,
  date: '2025-01-10',
  method: 'mixed',
  scope: '5 интервью',
  periodDays: 5,
  findings: [{ text: 'f', confidence: 'medium' }],
  evidence: [{ quote: 'q', source: 's' }],
  outcome: 'yellow',
  outcomeRationale: 'partial',
  nextStep: 'solution',
  decidedBy: 'team',
  createdAt: '2025-01-10T00:00:00.000Z',
  updatedAt: '2025-01-10T00:00:00.000Z',
};

function set(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValid(): void {
  set('Гипотеза', '1');
  set('Метод', 'live');
  set('Период (дней)', '7');
  set('Объём (scope)', '5 интервью');
  set('Вывод', 'подкаст хуже');
  set('Уверенность', 'high');
  set('Цитата', 'отложу на потом');
  set('Источник', 'synthetic CTO');
  set('Исход', 'green');
  set('Обоснование исхода', 'разрыв подтверждён');
  set('Следующий шаг', 'онлайн-оплата');
  set('Кто решил', 'команда');
}

describe('DecisionEditor', () => {
  it('blocks Save until valid, ignores invalid submit, then creates', () => {
    const onCreate = vi.fn();
    render(<DecisionEditor hypotheses={[hyp]} onCreate={onCreate} />);

    const btn = screen.getByRole('button', { name: /Сохранить решение/ });
    expect(btn).toBeDisabled();
    fireEvent.submit(screen.getByRole('form', { name: 'Новое решение' }));
    expect(onCreate).not.toHaveBeenCalled();

    fillValid();
    expect(btn).toBeEnabled();
    fireEvent.click(btn);
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0]?.[0]).toMatchObject({ hypothesisId: 1, outcome: 'green' });
  });
});

describe('DecisionsView', () => {
  it('renders pending / error / empty / list states', () => {
    const onCreate = vi.fn();
    const { rerender } = render(
      <DecisionsView status="pending" decisions={[]} hypotheses={[hyp]} onCreate={onCreate} />,
    );
    expect(screen.getByText('Загрузка…')).toBeInTheDocument();

    rerender(
      <DecisionsView status="error" decisions={[]} hypotheses={[hyp]} onCreate={onCreate} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(
      <DecisionsView status="success" decisions={[]} hypotheses={[hyp]} onCreate={onCreate} />,
    );
    expect(screen.getByText('Решений пока нет.')).toBeInTheDocument();

    rerender(
      <DecisionsView
        status="success"
        decisions={[decision]}
        hypotheses={[hyp]}
        onCreate={onCreate}
      />,
    );
    expect(screen.getByText('DL-001')).toBeInTheDocument();
  });
});

describe('Decisions (wrapper)', () => {
  beforeEach(() => {
    vi.mocked(api.decisions).mockResolvedValue([decision]);
    vi.mocked(api.hypotheses).mockResolvedValue([hyp]);
    vi.mocked(api.createDecision).mockResolvedValue(decision);
  });

  it('loads the log and creates a decision', async () => {
    renderWithProviders(<Decisions />);
    expect(await screen.findByText('DL-001')).toBeInTheDocument();

    fillValid();
    fireEvent.click(screen.getByRole('button', { name: /Сохранить решение/ }));
    await waitFor(() => expect(api.createDecision).toHaveBeenCalled());
  });
});
