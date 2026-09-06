function normalizeInset(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function getEffectiveBottomInset(keyboardHeight: number, safeAreaBottom: number): number {
  return Math.max(normalizeInset(keyboardHeight), normalizeInset(safeAreaBottom))
}
