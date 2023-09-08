import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { LogOptions } from './interfaces/log_options.interface.ts';

enum LogType {
  Error,
  Log,
  Info,
  Warning,
}

export class Logger {
  private readonly configurator = inject(Configurator);

  private readonly rightPadding = 4;

  private write(
    type: LogType,
    message: string,
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions,
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const maxMessageLength = Deno.consoleSize().columns -
      (additionalInfo?.length ?? 0) - badge.length - 2;

    const trimmedMessage = message.slice(0, maxMessageLength);
    const exceedsSpace = message.replaceAll('%c', '').length > maxMessageLength;

    const dotsLength = exceedsSpace ? 0 : Deno.consoleSize().columns -
      trimmedMessage.replaceAll('%c', '').length -
      (additionalInfo?.length ?? 0) -
      badge.length - this.rightPadding;

    const output = `%c${badge[0]?.toUpperCase() ?? ''}${
      badge.slice(1) ?? ''
    } %c${trimmedMessage}${exceedsSpace ? '...' : ''}${
      additionalInfo
        ? ` %c${
          this.configurator.entries.isDenoDeploy
            ? '• '
            : (dotsLength > 0 ? `${'.'.repeat(dotsLength)} ` : '')
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
