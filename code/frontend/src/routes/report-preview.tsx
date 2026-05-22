import { useMutation } from '@tanstack/react-query';
import type { ReportSnapshot } from '@pca/shared';
import { api } from '../lib/api';
import { useFilters } from '../store/filters';
import { formatInt } from '../lib/format';

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded border border-slate-200 p-2">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

/** Pure preview: the snapshot summary that DOCX/PDF will render from. */
export function ReportPreviewView({
  snapshot,
  isPending,
  onBuild,
}: {
  snapshot: ReportSnapshot | undefined;
  isPending: boolean;
  onBuild: () => void;
}): JSX.Element {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Превью отчёта</h2>
        <button
          type="button"
          onClick={onBuild}
          disabled={isPending}
          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white disabled:opacity-40"
        >
          {isPending ? 'Формирую…' : 'Сформировать snapshot'}
        </button>
      </div>

      {snapshot ? (
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">
            snapshot {snapshot.id} · период {snapshot.period.from} — {snapshot.period.to} ·
            сформирован {snapshot.generatedAt}
          </p>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Цель" value={formatInt(snapshot.kpi.target)} />
            <Stat label="Заявки B2C" value={formatInt(snapshot.kpi.b2cApplications)} />
            <Stat label="Оплачено B2B" value={formatInt(snapshot.kpi.b2bPaidTickets)} />
            <Stat label="Gap" value={formatInt(snapshot.kpi.gap)} />
          </div>
          <ul className="text-sm text-slate-600">
            <li>Каналов: {snapshot.channels.length}</li>
            <li>Problem-гипотез: {snapshot.hypotheses.problems.length}</li>
            <li>Solution-гипотез: {snapshot.hypotheses.solutions.length}</li>
            <li>Решений: {snapshot.decisions.length}</li>
          </ul>
        </div>
      ) : (
        <p className="text-slate-500">
          Нажмите «Сформировать snapshot», чтобы собрать неизменяемый отчёт за выбранный период.
        </p>
      )}
    </section>
  );
}

/** Data wrapper: builds a snapshot for the current period via mutation. */
export function ReportPreview(): JSX.Element {
  const { from, to } = useFilters();
  const mut = useMutation({ mutationFn: api.buildSnapshot });
  return (
    <ReportPreviewView
      snapshot={mut.data}
      isPending={mut.isPending}
      onBuild={() => mut.mutate({ from, to })}
    />
  );
}
