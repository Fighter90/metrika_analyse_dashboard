/** Informative empty state for pages with no data in the selected period. */
export function EmptyState({ message }: { message?: string }): JSX.Element {
  return (
    <div
      role="status"
      className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500"
    >
      {message ?? 'Нет данных за выбранный период. Запустите sync или измените фильтр.'}
    </div>
  );
}
