import {
  fromFileUrl,
  resolve as resolvePath,
} from 'https://deno.land/std@0.215.0/path/mod.ts';
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toSnakeCase,
} from 'https://deno.land/std@0.215.0/text/case.ts';

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

  public static escapeEntities(html: string) {
    return html.replace(
      /[&<>'"]/g,
      (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        };

        return entities[char as keyof typeof entities];
      },
    );
  }

  public static async executeShellCommand(
    name: string,
    args: string[] = [],
  ): Promise<boolean> {
    try {
      const command = new Deno.Command(
        name,
        {
          args,
          stdin: 'null',
          stdout: 'null',
          stderr: 'null',
        },
      );

      const { success } = await command.output();

      return success;
    } catch {
      return false;
    }
  }

  public static getEnumKey<TValue = string | number>(
    value: TValue,
    enumObject: Record<string, unknown>,
  ): string | undefined {
    return Object.keys(enumObject).find((key) => enumObject[key] === value);
  }

  public static mergeDeep<
    TTarget extends object = Record<string, unknown>,
    TObject = Record<string, unknown>,
  >(
    target: TTarget,
    ...elements: TObject[]
  ): TTarget {
    if (!elements.length) {
      return target;
    }

    const source = elements.shift() ?? {};

    for (const key in source) {
      if (
        (source[key as keyof typeof source] &&
          typeof source[key as keyof typeof source] === 'object' &&
          !Array.isArray(source[key as keyof typeof source]))
      ) {
        if (!target[key as keyof TTarget]) {
          Object.assign(target as object, {
            [key]: {},
          });
        }

        this.mergeDeep(
          target[key as keyof TTarget] as TTarget,
          source[key as keyof typeof source] as TObject,
        );

        continue;
      }

      Object.assign(target, {
        [key]: source[key as keyof typeof source],
      });
    }

    return this.mergeDeep(target, ...elements);
  }

  public static randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  public static randomFloat(min: number, max: number) {
    return Math.random() * (max - min) + min;
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

      case file.startsWith('views/'):
        break;

      default:
        file = `views/${file}`;
    }

    return resolvePath(file);
  }

  public static toCamelCase(text: string): string {
    return toCamelCase(text);
  }

  public static toConstantCase(text: string): string {
    return toSnakeCase(text).toUpperCase();
  }

  public static toKebabCase(text: string): string {
    return toKebabCase(text);
  }

  public static toPascalCase(text: string): string {
    return toPascalCase(text);
  }

  public static toSnakeCase(text: string): string {
    return toSnakeCase(text);
  }

  public static toTitleCase(text: string): string {
    return toPascalCase(text).replace(/([A-Z])/g, ' $1').trim();
  }
}
