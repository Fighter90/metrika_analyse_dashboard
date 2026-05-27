import type { ReactNode } from 'react';

export type TrafficLightStatus = 'green' | 'yellow' | 'red';

/**
 * WCAG-friendly traffic-light badge: colour + icon + text (never colour alone). High-contrast
 * dark-on-light palette (≥7:1). Used for hypothesis/decision outcomes.
 */
const MAP: Record<TrafficLightStatus, { icon: string; label: string; cls: string }> = {
  green: { icon: '🟢', label: 'Зелёный', cls: 'bg-emerald-50 text-emerald-900' },
  yellow: { icon: '🟡', label: 'Жёлтый', cls: 'bg-amber-100 text-amber-900' },
  red: { icon: '🔴', label: 'Красный', cls: 'bg-red-50 text-red-900' },
};

export function TrafficLight({
  status,
  children,
}: {
  status: TrafficLightStatus;
  children?: ReactNode;
}): JSX.Element {
  const m = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${m.cls}`}
    >
      <span aria-hidden="true">{m.icon}</span>
      <span>{children ?? m.label}</span>
    </span>
  );
}
