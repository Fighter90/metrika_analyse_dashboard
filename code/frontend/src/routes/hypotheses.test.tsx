import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { GeneratedHypotheses, ReportSnapshot } from '@pca/shared';
import { renderWithProviders } from '../test/utils';

vi.mock('../lib/api', () => ({
  api: { buildSnapshot: vi.fn(), generateHypotheses: vi.fn() },
}));
import { api } from '../lib/api';
import { HypothesesView, Hypotheses } from './hypotheses';
import type { HypothesesViewProps } from './hypotheses';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PROBLEMS: GeneratedHypotheses['problems'] = [
  {
    id: 'P01',
    segment: 'мобильный посетитель',
    trouble: 'не завершает оплату',
    action: 'покупке билета',
    barrier: 'форма оплаты не адаптирована',
    evidence: '68% мобильного трафика, CR 1.2% vs 4.8% на desktop',
  },
];

const SOLUTIONS: GeneratedHypotheses['solutions'] = [
  {
    id: 'S02',
    problemId: 'P01',
    action: 'заменим форму оплаты на мобильную',
    userBenefit: 'оплатить в 2 клика',
    businessResult: 'росту CR на мобильных +150%',
    successCriteria: 'CR mobile ≥ 3% через 14 дней',
    risks: [
      { kind: 'value', note: 'Пользователи не ценят скорость' },
      { kind: 'usability', note: 'Новая форма может путать' },
      { kind: 'feasibility', note: 'Интеграция платёжного шлюза' },
      { kind: 'business', note: 'Нужен бюджет на разработку' },
      { kind: 'legal', note: 'Требования 152-ФЗ' },
    ],
    validation: {
      whatToVerify: 'Готовность мобильных пользователей к новой форме',
      methods: ['интервью', 'A/B тест'],
      audience: 'мобильные посетители лендинга',
      channel: 'email рассылка',
      successCriteria: '≥60% подтверждают удобство',
    },
    ice: {
      impact: 9,
      confidence: 7,
      ease: 6,
      impactRationale: 'Крупнейший сегмент',
      confidenceRationale: 'Данные убедительны',
      easeRationale: 'Готовая библиотека',
      score: 378,
    },
  },
  {
    id: 'S01',
    problemId: 'P01',
    action: 'добавим push-напоминания',
    userBenefit: 'вернуться и завершить оплату',
    businessResult: 'снижению брошенных корзин',
    successCriteria: 'Возврат ≥5% из брошенных',
    risks: [
      { kind: 'value', note: 'Пользователи игнорируют push' },
      { kind: 'usability', note: 'Навязчивость уведомлений' },
      { kind: 'feasibility', note: 'Потребуется FCM интеграция' },
      { kind: 'business', note: 'ROI зависит от базы' },
      { kind: 'legal', note: 'Согласие на уведомления' },
    ],
    validation: {
      whatToVerify: 'Открываемость и конверсия из push',
      methods: ['A/B тест', 'аналитика'],
      audience: 'зарегистрированные пользователи',
      channel: 'мобильное приложение',
      successCriteria: '≥5% CTR по push',
    },
    ice: {
      impact: 5,
      confidence: 4,
      ease: 3,
      impactRationale: 'Небольшой эффект',
      confidenceRationale: 'Неопределённость высокая',
      easeRationale: 'Сложная интеграция',
      score: 60,
    },
  },
];

const HYPOTHESES: GeneratedHypotheses = { problems: PROBLEMS, solutions: SOLUTIONS };

const SNAPSHOT: ReportSnapshot = {
  id: 'snap-test',
  generatedAt: '2025-01-01T00:00:00.000Z',
  period: { from: '2025-01-01', to: '2025-01-07' },
  kpi: { target: 300, b2cApplications: 30, b2bPaidTickets: 20, gap: 250 },
  channels: [],
  hypotheses: { problems: [], solutions: [] },
  decisions: [],
  breakdowns: { utm: [], geoDevice: [], entryPages: [], exitPages: [] },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function baseProps(overrides: Partial<HypothesesViewProps> = {}): HypothesesViewProps {
  return {
    status: 'idle',
    hypotheses: undefined,
    genError: undefined,
    onGenerate: vi.fn(),
    ...overrides,
  };
}

// ─── HypothesesView — pure view tests ─────────────────────────────────────────

describe('HypothesesView', () => {
  it('idle: shows prompt and enabled button', () => {
    render(<HypothesesView {...baseProps()} />);
    expect(screen.getByRole('button', { name: 'Сгенерировать гипотезы' })).toBeEnabled();
    expect(screen.getByText(/Нажмите «Сгенерировать гипотезы»/)).toBeInTheDocument();
  });

  it('pending: shows generating label and disabled button', () => {
    render(<HypothesesView {...baseProps({ status: 'pending' })} />);
    expect(screen.getByRole('button', { name: 'Генерирую…' })).toBeDisabled();
  });

  it('error: shows the alert message', () => {
    render(
      <HypothesesView
        {...baseProps({ status: 'error', genError: 'AI-сервис недоступен (нет ключа)' })}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/нет ключа/);
  });

  it('success: renders problems and solutions sorted by ICE descending', () => {
    render(<HypothesesView {...baseProps({ status: 'success', hypotheses: HYPOTHESES })} />);

    // Problems
    expect(screen.getByText('P01')).toBeInTheDocument();
    expect(screen.getByText(/мобильный посетитель/)).toBeInTheDocument();
    expect(screen.getByText(/форма оплаты не адаптирована/)).toBeInTheDocument();
    expect(screen.getByText(/68% мобильного трафика/)).toBeInTheDocument();

    // Solutions — S02 (score 378) before S01 (score 60)
    const badges = screen.getAllByText(/S0[12]/);
    // S02 should appear before S01 in DOM
    expect(badges[0]?.textContent).toBe('S02');
    expect(badges[1]?.textContent).toBe('S01');

    // ICE scores rendered
    expect(screen.getByText('378')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();

    // Risks rendered
    expect(screen.getByText(/152-ФЗ/)).toBeInTheDocument();

    // Validation plan
    expect(screen.getByText(/Готовность мобильных пользователей/)).toBeInTheDocument();
  });

  it('success with empty hypotheses: renders empty-state messages', () => {
    render(
      <HypothesesView
        {...baseProps({ status: 'success', hypotheses: { problems: [], solutions: [] } })}
      />,
    );
    expect(screen.getByText('Проблем-гипотез не найдено.')).toBeInTheDocument();
    expect(screen.getByText('Решений-гипотез не найдено.')).toBeInTheDocument();
  });

  it('calls onGenerate when the button is clicked', () => {
    const onGenerate = vi.fn();
    render(<HypothesesView {...baseProps({ onGenerate })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать гипотезы' }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('no alert when genError is undefined', () => {
    render(<HypothesesView {...baseProps()} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('IceBadge covers score ≥500 (red) and score <50 (slate) thresholds', () => {
    // score ≥500 branch (lines 13-14 in IceBadge)
    const highSolution = {
      ...SOLUTIONS[0]!,
      id: 'S-HIGH',
      ice: { ...SOLUTIONS[0]!.ice, score: 600 },
    };
    // score <50 branch (lines 17-19 in IceBadge)
    const lowSolution = {
      ...SOLUTIONS[0]!,
      id: 'S-LOW',
      ice: { ...SOLUTIONS[0]!.ice, score: 10 },
    };
    render(
      <HypothesesView
        {...baseProps({
          status: 'success',
          hypotheses: { problems: [], solutions: [highSolution, lowSolution] },
        })}
      />,
    );
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});

// ─── Hypotheses (data wrapper) ────────────────────────────────────────────────

describe('Hypotheses (wrapper)', () => {
  beforeEach(() => {
    vi.mocked(api.buildSnapshot).mockResolvedValue(SNAPSHOT);
    vi.mocked(api.generateHypotheses).mockResolvedValue({ hypotheses: HYPOTHESES });
  });

  it('builds a snapshot then generates and shows hypotheses', async () => {
    renderWithProviders(<Hypotheses />);
    expect(screen.getByRole('button', { name: 'Сгенерировать гипотезы' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать гипотезы' }));

    await waitFor(() => {
      expect(api.buildSnapshot).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(api.generateHypotheses).toHaveBeenCalledWith('snap-test');
    });

    expect(await screen.findByText('P01')).toBeInTheDocument();
    expect(await screen.findByText('378')).toBeInTheDocument();
  });

  it('shows pending state (disabled button) while snapshot is building', async () => {
    let resolveBuild!: (v: typeof SNAPSHOT) => void;
    vi.mocked(api.buildSnapshot).mockReturnValue(
      new Promise<typeof SNAPSHOT>((res) => {
        resolveBuild = res;
      }),
    );
    renderWithProviders(<Hypotheses />);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать гипотезы' }));
    expect(await screen.findByRole('button', { name: 'Генерирую…' })).toBeDisabled();
    // Resolve so the mutation settles and the component can unmount cleanly.
    resolveBuild(SNAPSHOT);
  });

  it('shows an error alert when the snapshot build fails', async () => {
    vi.mocked(api.buildSnapshot).mockRejectedValue(new Error('503 нет ключа'));
    renderWithProviders(<Hypotheses />);
    fireEvent.click(screen.getByRole('button', { name: 'Сгенерировать гипотезы' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/503 нет ключа/);
  });
});
