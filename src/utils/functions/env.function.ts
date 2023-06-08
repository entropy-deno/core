export function env<T = string | number | boolean | null>(
  key: string,
  defaultValue?: T,
): typeof defaultValue extends string | number | boolean | null ? T : T | undefined {
  if (!(key in Deno.env.toObject())) {
    return defaultValue as (typeof defaultValue extends
      string | number | boolean | null ? typeof defaultValue
      : T | undefined);
  }

  try {
    return JSON.parse(
      Deno.env.get(key)?.toString() ?? 'null',
    ) as (typeof defaultValue extends string | number | boolean | null
      ? typeof defaultValue
      : T | undefined);
  } catch {
    return (Deno.env.get(key) as T) ??
      defaultValue as (typeof defaultValue extends string | number | boolean | null
        ? typeof defaultValue
        : T | undefined);
  }
}
