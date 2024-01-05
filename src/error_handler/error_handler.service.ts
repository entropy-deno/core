import { fromFileUrl } from 'https://deno.land/std@0.211.0/path/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Logger } from '../logger/logger.service.ts';

interface ErrorInfo {
  file?: string;
  line?: number;
}

export class ErrorHandler {
  private readonly configurator = inject(Configurator);

  private currentError?: Error;

  private currentFile?: string;

  private currentLine?: number;

  private readonly defaultFilePlaceholder = 'entropy module';

  private readonly logger = inject(Logger);

  private readErrorStack(): void {
    const stack = this.currentError?.stack ?? null;

    if (!stack) {
      this.currentFile = this.defaultFilePlaceholder;
      this.currentLine = undefined;

      return;
    }

    const whereThrown = stack.split('\n')[1];

    const thrownAt = whereThrown?.slice(
      whereThrown.indexOf('at ') + 2,
      whereThrown.length,
    );

    const overridenFile = (this.currentError?.cause as Error | undefined)
      ?.message;
    const file = overridenFile ?? thrownAt?.match(/\(file:\/\/(.*?)\)/)?.[1];

    if (file) {
      const fileUrl = `file://${file.split(Deno.cwd())[1]}`;
      const path = fromFileUrl(fileUrl).split(':')[0];

      this.currentFile = path === '/' ? this.defaultFilePlaceholder : path;
    }

    this.currentLine = Number(file?.match(/(?:.*):(.*):(.*)/)?.[1]);

    if (this.currentFile?.includes('src/')) {
      this.currentFile = `src/${this.currentFile.split('src/')[1]}`;
    }
  }

  public handle(error: Error): ErrorInfo {
    this.currentError = error;

    this.readErrorStack();

    this.logger.error(
      `${error.message} [${this.currentFile ?? this.defaultFilePlaceholder}${
        this.currentLine && this.currentFile !== this.defaultFilePlaceholder
          ? `:${this.currentLine}`
          : ''
      }]`,
    );

    return {
      file: this.currentFile,
      line: this.currentLine,
    };
  }
}
