import { useQuery } from '@tanstack/react-query';
import type { PageStat } from '@pca/shared';
import { api } from '../lib/api';
import { useFilters } from '../store/filters';
import { formatInt, formatPercent } from '../lib/format';
import { pageRows } from '../lib/behavior';
import type { QueryStatus } from '../lib/query-status';

/** Pure presentational Behavior view: top entry pages with bounce rate + conversion. */
export function BehaviorView({
  status,
  stats,
}: {
  status: QueryStatus;
  stats: PageStat[];
}): JSX.Element {
  if (status === 'pending') return <p className="text-slate-500">Загрузка…</p>;
  if (status === 'error')
    return (
      <p role="alert" className="text-red-600">
        Не удалось загрузить поведение.
      </p>
    );

  const rows = pageRows(stats);
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Страницы входа</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="py-1">Страница</th>
            <th>Визиты</th>
            <th>Пользователи</th>
            <th>Отказы</th>
            <th>Заявки</th>
            <th>CR</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.page} className="border-t border-slate-100">
              <td className="py-1">{r.page}</td>
              <td>{formatInt(r.visits)}</td>
              <td>{formatInt(r.users)}</td>
              <td>{formatPercent(r.bounceRate)}</td>
              <td>{formatInt(r.goalReaches)}</td>
              <td>{formatPercent(r.conversionRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** Data wrapper. */
export function Behavior(): JSX.Element {
  const { from, to } = useFilters();
  const q = useQuery({
    queryKey: ['pages', from, to],
    queryFn: () => api.pages({ from, to }),
  });
  return <BehaviorView status={q.status} stats={q.data ?? []} />;
}
