import { fromFileUrl } from '@std/path/mod.ts';
import { env } from '../utils/functions/env.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompiler } from '../template_compiler/template_compiler.service.ts';

export class ErrorHandler {
  private currentError: Error | null = null;

  private currentFile: string | null = null;

  private currentLine: number | null = null;

  private readonly templateCompiler = inject(TemplateCompiler);

  private readErrorStack(): void {
    const stack = this.currentError?.stack;

    if (!stack) {
      this.currentFile = 'internal file';
      this.currentLine = null;

      return;
    }

    if (env<boolean>('DEVELOPER_MODE') ?? false) {
      console.log(`\n%c${stack}`, 'color: gray');
    }

    const whereThrown = stack.split('\n')[1];

    const thrownAt = whereThrown?.slice(
      whereThrown.indexOf('at ') + 2,
      whereThrown.length,
    );

    const fileMatch = thrownAt?.match(/\((.*?)\)/);

    this.currentFile = (fileMatch?.[1] && fileMatch[1].includes('file://'))
      ? fromFileUrl(fileMatch[1]).split(':')[0]
      : 'internal file';
    this.currentLine = +(fileMatch?.[1]?.match(/(.*):(.*):(.*)/)?.[2] ?? 1);

    if (this.currentFile.includes('src/')) {
      this.currentFile = `src/${this.currentFile.split('src/')[1]}`;
    }
  }

  public async handle(error: Error): Promise<void> {
    this.currentError = error;

    this.readErrorStack();

    console.error(
      `\n%cError: ${error.message} %c[${this.currentFile}${
        this.currentLine ? `:${this.currentLine}` : ''
      }]`,
      `color: red`,
      'color: gray',
    );

    await this.templateCompiler.compile('error', {
      error,
    });
  }
}
