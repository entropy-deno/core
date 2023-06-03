export function env<T = string | number | boolean | null>(
  key: string,
  defaultValue: string | number | boolean | null | undefined = undefined,
): T | undefined {
  if (!(key in Deno.env.toObject())) {
    return defaultValue as T;
  }

  try {
    return JSON.parse(Deno.env.get(key)?.toString() ?? 'null');
  } catch {
    return (Deno.env.get(key) as T) ?? undefined;
  }
}
