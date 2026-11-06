/**
 * Display order for answer options. Pack authors usually write the correct answer first, so options are
 * shown in a shuffled order that is fixed per page and question (the same every time, for tests and filming).
 * Callers keep the original index for scoring and test ids.
 */
function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function optionOrder(key: string, n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i)
  let seed = hash(key) || 1
  for (let i = n - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    const j = seed % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}
