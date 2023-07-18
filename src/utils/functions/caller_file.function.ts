import { fromFileUrl } from 'https://deno.land/std@0.194.0/path/mod.ts';

export function callerFile() {
  const error = new Error();
  const [, , , data] = error.stack?.split('\n') ?? [];

  const filePathPattern = /(file:[/]{2}.+[^:0-9]):{1}[0-9]+:{1}[0-9]+/;
  const result = filePathPattern.exec(data);

  if (result && result.length > 1) {
    return fromFileUrl(result[1]);
  }

  return fromFileUrl(import.meta.url);
}
