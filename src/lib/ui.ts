const buttonBase =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";

export const btnPrimary = `${buttonBase} bg-accent text-accent-ink hover:opacity-90`;
export const btnSecondary = `${buttonBase} border border-line bg-surface text-ink hover:bg-hover`;
export const btnGhost = `${buttonBase} text-muted hover:bg-hover hover:text-ink`;
export const btnDanger = `${buttonBase} bg-danger text-white hover:opacity-90`;

export const inputClass =
  "h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-muted focus:border-ink";

export const tableHead =
  "px-4 py-2.5 text-left text-xs font-medium text-muted";
export const tableCell = "px-4 py-3 text-sm";
