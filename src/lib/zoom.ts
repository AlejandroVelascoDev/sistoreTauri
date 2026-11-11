export const ZOOM_LEVELS = [90, 100, 115, 130] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

const STORAGE_KEY = "zoom";

export function getStoredZoom(): ZoomLevel {
  const value = Number(localStorage.getItem(STORAGE_KEY));
  return (ZOOM_LEVELS as readonly number[]).includes(value)
    ? (value as ZoomLevel)
    : 100;
}

export function applyZoom(level: ZoomLevel) {
  localStorage.setItem(STORAGE_KEY, String(level));
  document.documentElement.style.fontSize = `${level}%`;
}

function stepZoom(direction: 1 | -1) {
  const index = ZOOM_LEVELS.indexOf(getStoredZoom());
  const next = ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, index + direction))];
  applyZoom(next);
}

export function initZoom() {
  applyZoom(getStoredZoom());

  window.addEventListener("keydown", (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;

    if (e.key === "=" || e.key === "+") {
      e.preventDefault();
      stepZoom(1);
    } else if (e.key === "-") {
      e.preventDefault();
      stepZoom(-1);
    } else if (e.key === "0") {
      e.preventDefault();
      applyZoom(100);
    }
  });
}
