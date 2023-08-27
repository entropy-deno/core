import { fromFileUrl } from 'https://deno.land/std@0.199.0/path/mod.ts';
import { resolve as resolvePath } from 'https://deno.land/std@0.199.0/path/mod.ts';

export abstract class Utils {
  public static callerFile() {
    const error = new Error();
    const [, , , data] = error.stack?.split('\n') ?? [];

    const filePathPattern = /(file:[/]{2}.+[^:0-9]):{1}[0-9]+:{1}[0-9]+/;
    const result = filePathPattern.exec(data);

    if (result && result.length > 1) {
      return fromFileUrl(result[1]);
    }

    return fromFileUrl(import.meta.url);
  }

  public static deepMerge<
    T = Record<string, unknown>,
    U = Record<string, unknown>,
  >(
    target: T,
    ...elements: U[]
  ): T {
    if (!elements.length) {
      return target;
    }

    const source = elements.shift();

    for (const key in source) {
      if (
        (source[key] && typeof source[key] === 'object' &&
          !Array.isArray(source[key]))
      ) {
        if (!target[key as keyof T]) {
          Object.assign(target as object, {
            [key]: {},
          });
        }

        this.deepMerge(
          target[key as keyof T] as T,
          source[key] as U,
        );
      } else {
        Object.assign(target as object, {
          [key]: source[key],
        });
      }
    }

    return this.deepMerge(target, ...elements);
  }

  public static escape(html: string) {
    return html.replace(
      /[&<>'"]/g,
      (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          '\'': '&#39;',
        };

        return entities[char as '&' | '<' | '>' | '"' | `'`];
      },
    );
  }

  public static getEnumKey<TValue = string | number>(
    value: TValue,
    enumObject: Record<string, unknown>,
  ): string {
    return Object.keys(enumObject).find((key) => enumObject[key] === value) ??
      '';
  }

  public static range(start: number, end?: number) {
    if (end === undefined) {
      end = start;
      start = 0;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => i + start);
  }

  public static resolveViewFile(caller: string, file: string): string {
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

    return resolvePath(file);
  }

  public static runShellCommand(name: string, args: string[] = []): void {
    const command = new Deno.Command(
      name,
      {
        args,
        stdin: 'null',
        stdout: 'null',
        stderr: 'null',
      },
    );

    command.spawn();
  }
}
