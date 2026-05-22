import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TRAFFIC_LIGHT, type Decision, type Hypothesis, type NewDecision } from '@pca/shared';
import { api } from '../lib/api';
import {
  decisionFormToInput,
  decisionFormValid,
  emptyDecisionForm,
  type DecisionForm,
} from '../lib/decision-form';

export type QueryStatus = 'pending' | 'error' | 'success';

const OUTCOME_CLASS: Record<(typeof TRAFFIC_LIGHT)[number], string> = {
  green: 'bg-green-200 text-green-900',
  yellow: 'bg-yellow-200 text-yellow-900',
  red: 'bg-red-200 text-red-900',
};

const METHODS = ['synthetic', 'live', 'quantitative', 'market', 'mixed'] as const;
const CONFIDENCES = ['high', 'medium', 'low'] as const;

function DecisionList({ decisions }: { decisions: Decision[] }): JSX.Element {
  if (decisions.length === 0) return <p className="text-slate-500">Решений пока нет.</p>;
  return (
    <ul className="space-y-2">
      {decisions.map((d) => (
        <li key={d.id} className="rounded border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{d.number}</span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold ${OUTCOME_CLASS[d.outcome]}`}
            >
              {d.outcome}
            </span>
            <span className="text-xs text-slate-500">гипотеза #{d.hypothesisId}</span>
          </div>
          <p className="mt-1 text-sm">{d.nextStep}</p>
          <p className="text-xs text-slate-500">
            {d.scope} · {d.decidedBy}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Txt({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  return (
    <label className="block text-sm">
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
      />
    </label>
  );
}

/** Decision Log editor; requires a linked hypothesis + evidence. */
export function DecisionEditor({
  hypotheses,
  onCreate,
}: {
  hypotheses: Hypothesis[];
  onCreate: (input: NewDecision) => void;
}): JSX.Element {
  const [form, setForm] = useState<DecisionForm>(emptyDecisionForm());
  const set = (patch: Partial<DecisionForm>): void => setForm((f) => ({ ...f, ...patch }));
  const valid = decisionFormValid(form);

  const submit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!valid) return;
    onCreate(decisionFormToInput(form));
    setForm(emptyDecisionForm());
  };

  return (
    <form aria-label="Новое решение" onSubmit={submit} className="space-y-3">
      <h2 className="text-lg font-semibold">Новое решение (Decision Log)</h2>
      <label className="block text-sm">
        Гипотеза
        <select
          aria-label="Гипотеза"
          value={form.hypothesisId}
          onChange={(e) => set({ hypothesisId: Number(e.target.value) })}
          className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
        >
          <option value={0}>— выберите гипотезу —</option>
          {hypotheses.map((h) => (
            <option key={h.id} value={h.id}>
              #{h.id} {h.title}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-sm">
          Метод
          <select
            aria-label="Метод"
            value={form.method}
            onChange={(e) => set({ method: e.target.value as DecisionForm['method'] })}
            className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Период (дней)
          <input
            aria-label="Период (дней)"
            type="number"
            value={form.periodDays}
            onChange={(e) => set({ periodDays: Number(e.target.value) })}
            className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
          />
        </label>
      </div>

      <Txt label="Объём (scope)" value={form.scope} onChange={(v) => set({ scope: v })} />
      <Txt label="Вывод" value={form.findingText} onChange={(v) => set({ findingText: v })} />
      <label className="block text-sm">
        Уверенность вывода
        <select
          aria-label="Уверенность"
          value={form.findingConfidence}
          onChange={(e) =>
            set({ findingConfidence: e.target.value as DecisionForm['findingConfidence'] })
          }
          className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
        >
          {CONFIDENCES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <Txt label="Цитата" value={form.evidenceQuote} onChange={(v) => set({ evidenceQuote: v })} />
      <Txt
        label="Источник"
        value={form.evidenceSource}
        onChange={(v) => set({ evidenceSource: v })}
      />

      <label className="block text-sm">
        Исход
        <select
          aria-label="Исход"
          value={form.outcome}
          onChange={(e) => set({ outcome: e.target.value as DecisionForm['outcome'] })}
          className="mt-0.5 block w-full rounded border border-slate-300 px-2 py-1"
        >
          {TRAFFIC_LIGHT.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <Txt
        label="Обоснование исхода"
        value={form.outcomeRationale}
        onChange={(v) => set({ outcomeRationale: v })}
      />
      <Txt label="Следующий шаг" value={form.nextStep} onChange={(v) => set({ nextStep: v })} />
      <Txt label="Кто решил" value={form.decidedBy} onChange={(v) => set({ decidedBy: v })} />

      <button
        type="submit"
        disabled={!valid}
        className="rounded bg-indigo-600 px-4 py-1.5 text-white disabled:opacity-40"
      >
        Сохранить решение
      </button>
    </form>
  );
}

/** Pure view: list + editor. */
export function DecisionsView({
  status,
  decisions,
  hypotheses,
  onCreate,
}: {
  status: QueryStatus;
  decisions: Decision[];
  hypotheses: Hypothesis[];
  onCreate: (input: NewDecision) => void;
}): JSX.Element {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold">Decision Log</h2>
        {status === 'pending' ? <p className="text-slate-500">Загрузка…</p> : null}
        {status === 'error' ? (
          <p role="alert" className="text-red-600">
            Не удалось загрузить решения.
          </p>
        ) : null}
        {status === 'success' ? <DecisionList decisions={decisions} /> : null}
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <DecisionEditor hypotheses={hypotheses} onCreate={onCreate} />
      </div>
    </section>
  );
}

/** Data + mutation wrapper. Creating a decision invalidates decisions AND hypotheses (status changes). */
export function Decisions(): JSX.Element {
  const qc = useQueryClient();
  const decisionsQ = useQuery({ queryKey: ['decisions'], queryFn: () => api.decisions() });
  const hypothesesQ = useQuery({ queryKey: ['hypotheses'], queryFn: () => api.hypotheses() });
  const createMut = useMutation({
    mutationFn: api.createDecision,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['decisions'] });
      void qc.invalidateQueries({ queryKey: ['hypotheses'] });
    },
  });
  return (
    <DecisionsView
      status={decisionsQ.status}
      decisions={decisionsQ.data ?? []}
      hypotheses={hypothesesQ.data ?? []}
      onCreate={createMut.mutate}
    />
  );
}
