// src/utils/formatPair.ts

/**
 * Renders "label: a/b" in LTR, or "label: b/a" in RTL
 * so that `a` ends up on the right side of the slash.
 */
export function formatPair(
  label: string,
  a: string | number,
  b: string | number,
  isRTL: boolean
): string {
  const pair = isRTL ? `${b}/${a}` : `${a}/${b}`;
  return `${label}: ${pair}`;
}
