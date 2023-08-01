import { fromFileUrl } from 'https://deno.land/std@0.196.0/path/mod.ts';

export class Utils {
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

  public static enumKey<T = string | number>(
    value: T,
    enumObject: Record<string, unknown>,
  ): string {
    return Object.keys(enumObject).find((key) => enumObject[key] === value) ?? '';
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

  public static range(start: number, end?: number) {
    if (end === undefined) {
      end = start;
      start = 0;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => i + start);
  }
}
