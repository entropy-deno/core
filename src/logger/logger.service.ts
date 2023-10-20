import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface LogOptions {
  additionalInfo?: string;
  badge?: string;
  colors?: string[];
}

enum LogType {
  Error,
  Log,
  Info,
  Warning,
}

export class Logger {
  private readonly configurator = inject(Configurator);

  private readonly endPadding = 4;

  private write(
    type: LogType,
    message: string | string[],
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions,
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    if (Array.isArray(message)) {
      for (const text of message) {
        this.write(type, text, {
          additionalInfo,
          badge,
          colors,
        });
      }

      return;
    }

    const maxMessageLength = Deno.consoleSize().columns - badge.length - 2;
    const plainMessage = message.replaceAll('%c', '');
    const exceedsSpace = plainMessage.length > maxMessageLength;
    const trimmedMessage = exceedsSpace
      ? message.slice(0, maxMessageLength)
      : message;

    const dotsLength = exceedsSpace ? 0 : Deno.consoleSize().columns -
      plainMessage.length -
      badge.length - this.endPadding;

    if (dotsLength < 0) {
      this.clear();

      console.log(
        '%cConsole size is too low to render some logs',
        'color: red; font-weight: bold',
      );

      return;
    }

    const output = `%c${badge} %c${trimmedMessage}${exceedsSpace ? '...' : ''}${
      additionalInfo && !exceedsSpace
        ? ` %c${
          this.configurator.entries.isDenoDeploy
            ? '• '
            : (dotsLength ? `${'.'.repeat(dotsLength)} ` : '')
        }${additionalInfo}`
        : ''
    }`;

    const params = [
      output,
      `color: ${
        type === LogType.Error
          ? 'red'
          : type === LogType.Warning
          ? 'orange'
          : 'blue'
      }`,
      '',
      ...colors.slice(
        0,
        trimmedMessage.replace(/(%c|%)$/, '').match(/%c/g)?.length ?? 0,
      ).map((color) => `color: ${color}`),
      ...(additionalInfo && !exceedsSpace ? ['color: gray'] : []),
    ];

    switch (type) {
      case LogType.Error:
        console.error(...params);

        break;

      case LogType.Log:
      case LogType.Info:
        console.log(...params);

        break;

      case LogType.Warning:
        console.warn(...params);

        break;
    }
  }

  public clear(): void {
    console.clear();
  }

  public error(
    message: string | string[],
    { additionalInfo, badge = 'Error', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Error, message, { additionalInfo, badge, colors });
  }

  public info(
    message: string | string[],
    { additionalInfo, badge = 'Info', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Info, message, { additionalInfo, badge, colors });
  }

  public log(
    message: string | string[],
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Log, message, { additionalInfo, badge, colors });
  }

  public raw(...messages: string[]): void {
    console.log(...messages);
  }

  public warn(
    message: string | string[],
    { additionalInfo, badge = 'Warning', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Warning, message, { additionalInfo, badge, colors });
  }
}
