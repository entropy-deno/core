import { fromFileUrl } from '@std/path/mod.ts';
import { env } from '../utils/functions/env.function.ts';

export class ErrorHandler {
  private currentError: Error | null = null;

  private currentFile: string | null = null;

  private currentLine: number | null = null;

  private currentStack: string | null = null;

  private readonly defaultFile = 'entropy module';

  private readErrorStack(): void {
    const stack = this.currentError?.stack ?? null;

    if (!stack) {
      this.currentFile = this.defaultFile;
      this.currentLine = null;

      return;
    }

    const whereThrown = stack.split('\n')[1];

    const thrownAt = whereThrown?.slice(
      whereThrown.indexOf('at ') + 2,
      whereThrown.length,
    );

    const fileMatch = thrownAt?.match(/\(file:\/\/(.*?)\)/) ?? [];

    this.currentFile = fileMatch[1]
      ? fromFileUrl(`file://${fileMatch[1]}`).split(':')[0]
      : this.defaultFile;

    this.currentLine = +(fileMatch[1]?.match(/(.*):(.*):(.*)/)?.[2] ?? 1);

    this.currentStack = stack.split('\n').slice(1).map((line) => line.trim()).join(
      '\n',
    );

    if (this.currentFile.includes('src/')) {
      this.currentFile = `src/${this.currentFile.split('src/')[1]}`;
    }
  }

  public handle(error: Error): void {
    this.currentError = error;

    this.readErrorStack();

    console.error(
      `\n%cError: ${error.message} %c[${this.currentFile}${
        this.currentLine && this.currentFile !== this.defaultFile
          ? `:${this.currentLine}`
          : ''
      }]`,
      `color: red`,
      'color: gray',
    );

    if (this.currentStack && (env<boolean>('DEVELOPER_MODE') ?? false)) {
      console.log(`\n%c${this.currentStack}`, 'color: gray');
    }
  }
}
