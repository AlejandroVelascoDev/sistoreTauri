import type { ReactNode } from "react";

interface StatProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "warn";
}

export default function Stat({ label, value, tone = "default" }: StatProps) {
  return (
    <div className="px-6 py-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd
        className={`mt-1 text-2xl font-semibold tabular-nums ${
          tone === "warn" ? "text-warn" : "text-ink"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
