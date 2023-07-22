import { resolve } from 'https://deno.land/std@0.194.0/path/mod.ts';

export function resolveViewFile(caller: string, file: string): string {
  switch (true) {
    case file.startsWith('./'):
      file = `${caller}/../${file.slice(2)}`;

      break;

    case file[0] === '/':
      file = `views/${file.slice(1)}`;

      break;

    case file.startsWith('/views/'):
      file = file.slice(1);

      break;

    default:
      file = `views/${file}`;
  }

  return resolve(file);
}
