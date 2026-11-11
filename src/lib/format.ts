export function formatMoney(value: number) {
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function parseDate(value: string) {
  return new Date(value.includes("T") ? value : value.replace(" ", "T"));
}
