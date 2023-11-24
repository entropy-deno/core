import { fromFileUrl } from 'https://deno.land/std@0.208.0/path/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Logger } from '../logger/logger.service.ts';

export class ErrorHandler {
  private readonly configurator = inject(Configurator);

  private currentError: Error | null = null;

  private currentFile: string | null = null;

  private currentLine: number | null = null;

  private readonly defaultFilePlaceholder = 'entropy module';

  private readonly logger = inject(Logger);

  private readErrorStack(): void {
    const stack = this.currentError?.stack ?? null;

    if (!stack) {
      this.currentFile = this.defaultFilePlaceholder;
      this.currentLine = null;

      return;
    }

    const whereThrown = stack.split('\n')[1];

    const thrownAt = whereThrown?.slice(
      whereThrown.indexOf('at ') + 2,
      whereThrown.length,
    );

    const file = (this.currentError?.cause as Error | undefined)?.message ??
      thrownAt?.match(/\(file:\/\/(.*?)\)/)?.[1];

    if (file) {
      const fileUrl = `file://${file.split(Deno.cwd())[1]}`;
      const path = fromFileUrl(fileUrl).split(':')[0];

      this.currentFile = path === '/' ? this.defaultFilePlaceholder : path;
    }

    const line = file?.match(/(?:.*):(.*):(.*)/)?.[1];

    this.currentLine = line
      ? Number(file?.match(/(?:.*):(.*):(.*)/)?.[1])
      : null;

    if (this.currentFile?.includes('src/')) {
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
      `${error.message} [${this.currentFile ?? this.defaultFilePlaceholder}${
        this.currentLine && this.currentFile !== this.defaultFilePlaceholder
          ? `:${this.currentLine}`
          : ''
      }]`,
    );

    if (die && !this.configurator.entries.isDenoDeploy) {
      Deno.exit(1);
    }
  }
}
