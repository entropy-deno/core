export function enumKey<T = string | number>(
  value: T,
  enumObject: Record<string, unknown>,
): string {
  return Object.keys(enumObject).find((key) => enumObject[key] === value) ?? '';
}
