/** Which of `count` items to feature in a given month: the month of `start` ("2026-11") shows the first. */
export function rotationIndex(start: string, count: number, now = new Date()) {
  const [y, m] = start.split('-').map(Number);
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m);
  return ((months % count) + count) % count;
}
