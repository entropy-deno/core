import { fromFileUrl } from 'https://deno.land/std@0.200.0/path/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Logger } from '../logger/logger.service.ts';

export class ErrorHandler {
  private readonly configurator = inject(Configurator);

  private currentError: Error | null = null;

  private currentFile: string | null = null;

  private currentLine: number | null = null;

  private currentStack: string | null = null;

  private readonly defaultFile = 'entropy module';

  private readonly logger = inject(Logger);

  private readErrorStack(): void {
    const stack = this.currentError?.stack ?? null;

    if (!stack) {
      this.currentFile = this.defaultFile;
      this.currentLine = null;
      this.currentStack = null;

      return;
    }

    const whereThrown = stack.split('\n')[1];

    const thrownAt = whereThrown?.slice(
      whereThrown.indexOf('at ') + 2,
      whereThrown.length,
    );

    const file = thrownAt?.match(/\(file:\/\/(.*?)\)/)?.[1];

    this.currentFile = file
      ? fromFileUrl(`file://${file}`).split(':')[0]
      : this.defaultFile;

    this.currentLine = Number(file?.match(/(.*):(.*):(.*)/)?.[2] ?? 1);

    this.currentStack = stack.split('\n').slice(1).map((line) => line.trim())
      .slice(0, 4)
      .join(
        '\n',
      ).replace(/\n.*$/, '');

    if (this.currentFile.includes('src/')) {
      this.currentFile = `src/${this.currentFile.split('src/')[1]}`;
    }
  }

  public handle(
    error: Error,
    die = this.configurator.entries.isProduction,
  ): void {
    this.currentError = error;

    this.readErrorStack();

    this.logger.error(
      `${error.message} %c[${this.currentFile}${
        this.currentLine && this.currentFile !== this.defaultFile
          ? `:${this.currentLine}`
          : ''
      }]`,
      {
        colors: ['gray'],
      },
    );

    if (this.currentStack) {
      this.logger.raw(`%c${this.currentStack}\n`, 'color: gray');
    }

    if (die && !this.configurator.entries.isDenoDeploy) {
      Deno.exit(1);
    }
  }
}
