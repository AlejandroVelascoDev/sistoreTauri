import { Delete } from "lucide-react";

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "00", "0", "⌫"];

export default function Keypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onKey(key)}
          aria-label={key === "⌫" ? "Borrar" : key}
          className="flex h-11 items-center justify-center rounded-md border border-line bg-hover text-lg font-medium tabular-nums transition-colors duration-150 hover:border-ink active:scale-[0.97]"
        >
          {key === "⌫" ? <Delete className="h-4 w-4" /> : key}
        </button>
      ))}
    </div>
  );
}
