import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface LogOptions {
  additionalInfo?: string;
  colors?: string[];
}

export class Logger {
  private readonly configurator = inject(Configurator);

  private readonly endPadding = 4;

  private write(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions,
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    if (Array.isArray(message)) {
      for (const text of message) {
        this.write(text, {
          additionalInfo,
          colors,
        });
      }

      return;
    }

    const maxMessageLength = Deno.consoleSize().columns - this.endPadding;
    const plainMessage = message.replaceAll('%c', '');
    const exceedsSpace = plainMessage.length > maxMessageLength;

    const trimmedMessage = exceedsSpace
      ? message.slice(0, maxMessageLength)
      : message;

    const dotsLength = exceedsSpace ? 0 : Deno.consoleSize().columns -
      plainMessage.length - this.endPadding;

    if (dotsLength < 0) {
      this.clear();

      this.error('Console size is too low to render some logs');

      return;
    }

    const output = `%c${trimmedMessage}${exceedsSpace ? '...' : ''}${
      additionalInfo && !exceedsSpace
        ? ` %c${
          this.configurator.entries.isDenoDeploy
            ? '• '
            : (dotsLength ? `${'.'.repeat(dotsLength - 5)} ` : '')
        }${additionalInfo}`
        : ''
    }`;

    const messageEnd =
      trimmedMessage.replace(/(%c|%)$/, '').match(/%c/g)?.length ?? 0;

    const params = [
      output,
      'font-weight: bold',
      ...colors.slice(0, messageEnd).map((color) =>
        `color: ${color}; font-weight: bold`
      ),
      ...(additionalInfo && !exceedsSpace ? ['color: gray'] : []),
    ];

    console.log(...params);
  }

  public clear(): void {
    console.clear();
  }

  public error(message: string | string[]): void {
    if (Array.isArray(message)) {
      for (const text of message) {
        this.error(text);
      }

      return;
    }

    console.error(`%c${message}`, 'color: red; font-weight: bold');
  }

  public info(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.write(message, {
      additionalInfo,
      colors,
    });
  }

  public log(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.write(message, {
      additionalInfo,
      colors,
    });
  }

  public raw(...messages: string[]): void {
    console.log(...messages);
  }

  public success(message: string | string[]): void {
    if (Array.isArray(message)) {
      for (const text of message) {
        this.success(text);
      }

      return;
    }

    console.log(`%c${message}`, 'color: green; font-weight: bold');
  }

  public table(data: unknown): void {
    console.table(data);
  }

  public warn(message: string | string[]): void {
    if (Array.isArray(message)) {
      for (const text of message) {
        this.warn(text);
      }

      return;
    }

    console.warn(`%c${message}`, 'color: orange; font-weight: bold');
  }
}
