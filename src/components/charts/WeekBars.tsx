interface WeekBarsProps {
  labels: string[];
  current: number[];
  previous: number[];
  currentLabel: string;
  previousLabel: string;
  format: (value: number) => string;
}

export default function WeekBars({
  labels,
  current,
  previous,
  currentLabel,
  previousLabel,
  format,
}: WeekBarsProps) {
  const max = Math.max(1, ...current, ...previous);
  const pct = (value: number) => `${(value / max) * 100}%`;

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
          {currentLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-line" />
          {previousLabel}
        </span>
      </div>

      <div className="flex h-56 items-end gap-3">
        {labels.map((label, i) => (
          <div key={label + i} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1.5">
              <div
                title={`${previousLabel} · ${label}: ${format(previous[i] ?? 0)}`}
                style={{ height: pct(previous[i] ?? 0) }}
                className="w-1/3 max-w-6 min-h-px rounded-t bg-line transition-[height] duration-500"
              />
              <div
                title={`${currentLabel} · ${label}: ${format(current[i] ?? 0)}`}
                style={{ height: pct(current[i] ?? 0) }}
                className="w-1/3 max-w-6 min-h-px rounded-t bg-accent transition-[height] duration-500"
              />
            </div>
            <span className="text-xs text-muted capitalize">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
