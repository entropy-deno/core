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
    message: string,
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions,
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const maxMessageLength = Deno.consoleSize().columns - badge.length -
      (additionalInfo?.length ?? 0) - 2;

    const exceedsSpace = message.replaceAll('%c', '').length > maxMessageLength;
    const trimmedMessage = message.slice(0, maxMessageLength);

    const dotsLength = exceedsSpace ? 0 : Deno.consoleSize().columns -
      trimmedMessage.replaceAll('%c', '').length -
      (additionalInfo?.length ?? 0) -
      badge.length - this.endPadding;

    const output = `%c${badge} %c${trimmedMessage}${exceedsSpace ? '...' : ''}${
      additionalInfo
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
      ...colors.map((color) => `color: ${color}`),
      ...[additionalInfo ? 'color: gray' : ''],
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

  public error(
    message: string,
    { additionalInfo, badge = 'Error', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Error, message, { additionalInfo, badge, colors });
  }

  public info(
    message: string,
    { additionalInfo, badge = 'Info', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Info, message, { additionalInfo, badge, colors });
  }

  public log(
    message: string,
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Log, message, { additionalInfo, badge, colors });
  }

  public raw(...messages: string[]): void {
    console.log(...messages);
  }

  public warn(
    message: string,
    { additionalInfo, badge = 'Warning', colors = [] }: LogOptions = {},
  ): void {
    this.write(LogType.Warning, message, { additionalInfo, badge, colors });
  }
}
