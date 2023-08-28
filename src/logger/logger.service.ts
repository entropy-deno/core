import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { LogOptions } from './interfaces/log_options.interface.ts';

export class Logger {
  private readonly configurator = inject(Configurator);

  private readonly rightPadding = 4;

  public error(
    message: string,
    { additionalInfo, badge = 'Error', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const outputWidth = (additionalInfo ?? '').length + badge.length +
      message.replaceAll('%c', '').length + this.rightPadding;

    const exceedsSpace = outputWidth >
      Deno.consoleSize().columns - message.replaceAll('%c', '').length;

    const trimmedMessage = message.slice(
      0,
      Deno.consoleSize().columns - outputWidth - 1,
    ).replace(/(%c|%)$/, '');

    console.error(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: red',
      '',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length ?? 0,
      ).map((color) => `color: ${color}`),
    );
  }

  public info(
    message: string,
    { additionalInfo, badge = 'Info', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const outputWidth = (additionalInfo ?? '').length + badge.length +
      message.replaceAll('%c', '').length + this.rightPadding;

    const exceedsSpace = outputWidth >
      Deno.consoleSize().columns - message.replaceAll('%c', '').length;

    const trimmedMessage = message.slice(
      0,
      Deno.consoleSize().columns - outputWidth - 1,
    ).replace(/(%c|%)$/, '');

    console.log(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: blue',
      '',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length ?? 0,
      ).map((color) => `color: ${color}`),
    );
  }

  public log(
    message: string,
    { additionalInfo, badge = 'Log', colors = [] }: LogOptions = {},
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

    console.log(
      output,
      'color: blue',
      '',
      ...colors.map((color) => `color: ${color}`),
      ...[additionalInfo ? 'color: gray' : ''],
    );
  }

  public raw(...messages: string[]): void {
    console.log(...messages);
  }

  public warn(
    message: string,
    { additionalInfo, badge = 'Warning', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const outputWidth = (additionalInfo ?? '').length + badge.length +
      message.replaceAll('%c', '').length + this.rightPadding;

    const exceedsSpace = outputWidth >
      Deno.consoleSize().columns - message.replaceAll('%c', '').length;

    const trimmedMessage = message.slice(
      0,
      Deno.consoleSize().columns - outputWidth - 1,
    ).replace(/(%c|%)$/, '');

    console.warn(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: orange',
      '',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length ?? 0,
      ).map((color) => `color: ${color}`),
    );
  }
}
