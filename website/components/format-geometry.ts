// Presentation only. Never round the store snapshot or application calculations.
export function formatGeometry(value: number): string {
  return String(Number(value.toFixed(2)))
}
