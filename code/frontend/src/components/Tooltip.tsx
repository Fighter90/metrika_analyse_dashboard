import type { ReactNode } from 'react';

/**
 * Accessible info tooltip: an ⓘ trigger with an aria-label, plus the explanatory text always in the
 * DOM (shown on hover/focus). No JS state, no new dependency — group-hover/focus-within CSS only.
 */
export function Tooltip({ text, children }: { text: string; children?: ReactNode }): JSX.Element {
  return (
    <span className="group relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        aria-label={`Подсказка: ${text}`}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] leading-none text-slate-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
