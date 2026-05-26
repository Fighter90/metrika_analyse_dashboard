import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ChannelStat, GeoDeviceStat, UtmStat, PageStat } from '@pca/shared';
import { api } from '../lib/api';
import { useFilters } from '../store/filters';
import { formatInt, formatPercent } from '../lib/format';
import { EmptyState } from '../components/EmptyState';
import {
  channelMixOption,
  dailyReachesOption,
  summarizeChannels,
  weakSpots,
} from '../lib/overview';
import { dailySeries, trendsOption } from '../lib/trends';
import { byCountry, byDevice, audienceBarOption, deviceShareOption } from '../lib/audience';
import { EChart } from '../components/charts/EChart';

export type QueryStatus = 'pending' | 'error' | 'success';

/** Pure presentational Overview — testable across all states without the data layer. */
export function OverviewView({
  status,
  stats,
  primaryGoalName,
  geoDevice,
  utm,
  entryPages,
  exitPages,
}: {
  status: QueryStatus;
  stats: ChannelStat[];
  primaryGoalName?: string;
  geoDevice?: GeoDeviceStat[];
  utm?: UtmStat[];
  entryPages?: PageStat[];
  exitPages?: PageStat[];
}): JSX.Element {
  if (status === 'pending') return <p className="text-slate-500">Загрузка…</p>;
  if (status === 'error')
    return (
      <p role="alert" className="text-red-600">
        Не удалось загрузить данные. Запустите sync и проверьте backend.
      </p>
    );

  if (stats.length === 0) return <EmptyState />;

  const kpi = summarizeChannels(stats);
  const weak = weakSpots(stats);
  const geoRows = geoDevice ? byCountry(geoDevice) : [];
  const devRows = geoDevice ? byDevice(geoDevice) : [];
  const hasGeo = geoRows.length > 0 && devRows.length > 0;

  // UTM coverage
  const utmWithSource = utm?.filter((u) => u.utmSource && u.utmSource !== '(none)') ?? [];
  const utmCoverage =
    utm && utm.length > 0
      ? ((utmWithSource.length / utm.length) * 100).toFixed(0)
      : '0';
  const lowUtm = utm && utm.length > 0 && Number(utmCoverage) < 70;

  // Top entry pages
  const topEntry = (entryPages ?? [])
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);
  const topExit = (exitPages ?? [])
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5);

  return (
    <section className="space-y-6">
      {primaryGoalName ? (
        <p className="rounded border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          KPI-цель определена автоматически: <b>{primaryGoalName}</b> — на её достижениях строятся
          заявки. Чтобы зафиксировать другую, задайте <code>GOAL_ID</code>.
        </p>
      ) : null}

      {lowUtm ? (
        <div role="status" className="rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">
          Низкое покрытие UTM: {utmCoverage}% (порог 70%) — часть трафика не атрибутирована.
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-4">
        <Kpi label="Цель (платных билетов)" value={formatInt(kpi.target)} />
        <Kpi label="Заявок (goal reaches)" value={formatInt(kpi.reaches)} hint="заявка ≠ оплата" />
        <Kpi label="Gap до цели" value={formatInt(kpi.gap)} />
      </div>

      <Card title="Визиты и заявки по дням">
        <EChart option={trendsOption(dailySeries(stats))} />
      </Card>

      <Card title="Заявки по дням">
        <EChart option={dailyReachesOption(stats)} />
      </Card>

      <Card title="Микс каналов (визиты)">
        <EChart option={channelMixOption(stats)} />
      </Card>

      {hasGeo ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="Топ стран по визитам">
            <EChart option={audienceBarOption(geoRows, '')} />
          </Card>
          <Card title="Доля устройств (визиты)">
            <EChart option={deviceShareOption(devRows)} />
          </Card>
        </div>
      ) : null}

      {/* UTM breakdown */}
      {utm && utm.length > 0 && (
        <Card title={`UTM-разбивка (покрытие ${utmCoverage}%)`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Source</th>
                <th>Medium</th>
                <th>Campaign</th>
                <th>Визиты</th>
                <th>Заявки</th>
                <th>CR</th>
              </tr>
            </thead>
            <tbody>
              {utm
                .sort((a, b) => b.visits - a.visits)
                .slice(0, 10)
                .map((u) => (
                  <tr key={`${u.utmSource}-${u.utmMedium}-${u.utmCampaign}`} className="border-t border-slate-100">
                    <td className="py-1">{u.utmSource ?? '(none)'}</td>
                    <td>{u.utmMedium ?? '(none)'}</td>
                    <td>{u.utmCampaign ?? '(none)'}</td>
                    <td>{formatInt(u.visits)}</td>
                    <td>{formatInt(u.goalReaches)}</td>
                    <td>{formatPercent(u.conversionRate)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Entry pages */}
      {topEntry.length > 0 && (
        <Card title="Топ страниц входа">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Страница</th>
                <th>Визиты</th>
                <th>Отказы</th>
                <th>Заявки</th>
              </tr>
            </thead>
            <tbody>
              {topEntry.map((p) => (
                <tr key={p.page} className="border-t border-slate-100">
                  <td className="py-1">{p.page}</td>
                  <td>{formatInt(p.visits)}</td>
                  <td>{formatPercent(p.bounceRate)}</td>
                  <td>{formatInt(p.goalReaches)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Exit pages */}
      {topExit.length > 0 && (
        <Card title="Топ страниц выхода">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Страница</th>
                <th>Визиты</th>
                <th>Отказы</th>
                <th>Заявки</th>
              </tr>
            </thead>
            <tbody>
              {topExit.map((p) => (
                <tr key={p.page} className="border-t border-slate-100">
                  <td className="py-1">{p.page}</td>
                  <td>{formatInt(p.visits)}</td>
                  <td>{formatPercent(p.bounceRate)}</td>
                  <td>{formatInt(p.goalReaches)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Слабые места (трафик есть, конверсия ниже средней)">
        {weak.length === 0 ? (
          <p className="text-sm text-slate-500">Нет слабых мест по текущим данным.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {weak.map((w) => (
              <li key={w.channel} className="flex justify-between border-b border-slate-100 py-1">
                <span>{w.channel}</span>
                <span className="text-slate-500">
                  {formatInt(w.visits)} визитов · CR {formatPercent(w.conversionRate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}

/** Data wrapper: binds the channel query to the presentational view. */
export function Overview(): JSX.Element {
  const { from, to } = useFilters();
  const q = useQuery({
    queryKey: ['channels', from, to],
    queryFn: () => api.channels({ from, to }),
  });
  // The auto-detected KPI goal — independent of the date range. Absent (404) → badge hidden.
  const goal = useQuery({ queryKey: ['primary-goal'], queryFn: api.primaryGoal, retry: false });
  const geoDevice = useQuery({
    queryKey: ['geo-device', from, to],
    queryFn: () => api.geoDevice({ from, to }),
  });
  const utm = useQuery({
    queryKey: ['utm', from, to],
    queryFn: () => api.utm({ from, to }),
  });
  const entryPages = useQuery({
    queryKey: ['pages', from, to],
    queryFn: () => api.pages({ from, to }),
  });
  const exitPages = useQuery({
    queryKey: ['exit-pages', from, to],
    queryFn: () => api.exitPages({ from, to }),
  });
  return (
    <OverviewView
      status={q.status}
      stats={q.data ?? []}
      primaryGoalName={goal.data?.name}
      geoDevice={geoDevice.data}
      utm={utm.data}
      entryPages={entryPages.data}
      exitPages={exitPages.data}
    />
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint ? <div className="mt-1 text-xs text-amber-600">{hint}</div> : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
