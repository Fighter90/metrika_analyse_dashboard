/**
 * Caption block rendered under a chart: what the chart shows correctly, what to be
 * careful about (data caveats), and a recommendation. Keeps every chart self-explanatory
 * so a volunteer can read the dashboard without a brief.
 */
export interface ChartCaptionProps {
  /** What the chart correctly represents and where the numbers trace to. */
  readonly correct: string;
  /** A data caveat or known limitation. Omit when there is nothing to flag. */
  readonly caveat?: string;
  /** A concrete next action for the reader. */
  readonly advice: string;
}

export function ChartCaption({ correct, caveat, advice }: ChartCaptionProps): JSX.Element {
  return (
    <dl className="mt-3 space-y-1 rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed">
      <div className="flex gap-2">
        <dt className="shrink-0 font-medium text-green-700">🟢 Корректно</dt>
        <dd className="text-slate-600">{correct}</dd>
      </div>
      {caveat ? (
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-red-700">🔴 Внимание</dt>
          <dd className="text-slate-600">{caveat}</dd>
        </div>
      ) : null}
      <div className="flex gap-2">
        <dt className="shrink-0 font-medium text-indigo-700">💡 Рекомендация</dt>
        <dd className="text-slate-600">{advice}</dd>
      </div>
    </dl>
  );
}
