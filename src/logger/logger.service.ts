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

      this.error('Console size is too low to render some logs');

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
      `color: ${type === LogType.Error ? 'red' : 'blue'}`,
      '',
      ...colors.slice(
        0,
        trimmedMessage.replace(/(%c|%)$/, '').match(/%c/g)?.length ?? 0,
      ).map((color) => `color: ${color}`),
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
