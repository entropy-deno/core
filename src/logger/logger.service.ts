import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface LogOptions {
  additionalInfo?: string;
  colors?: string[];
  mainColor?: string;
}

export class Logger {
  private readonly configurator = inject(Configurator);

  private readonly endPadding = 4;

  private writeLog(
    message: string | string[],
    { additionalInfo, colors = [], mainColor }: LogOptions,
  ): void {
    if (!this.configurator.entries.logger.enabled) {
      return;
    }

    if (Array.isArray(message)) {
      for (const text of message) {
        this.writeLog(text, {
          additionalInfo,
          colors,
          mainColor,
        });
      }

      return;
    }

    if (mainColor) {
      message = `%c${message}`;
      colors = [mainColor, ...colors];
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

  public error(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.writeLog(message, {
      additionalInfo,
      colors,
      mainColor: 'red',
    });
  }

  public info(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.writeLog(message, {
      additionalInfo,
      colors,
    });
  }

  public raw(...messages: string[]): void {
    console.log(...messages);
  }

  public success(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.writeLog(message, {
      additionalInfo,
      colors,
      mainColor: 'green',
    });
  }

  public table(data: unknown): void {
    console.table(data);
  }

  public warn(
    message: string | string[],
    { additionalInfo, colors = [] }: LogOptions = {},
  ): void {
    this.writeLog(message, {
      additionalInfo,
      colors,
      mainColor: 'orange',
    });
  }
}
