export function range(start: number, end?: number) {
  if (end === undefined) {
    end = start;
    start = 0;
  }

  return Array.from({ length: end - start + 1 }, (_, i) => i + start);
}
