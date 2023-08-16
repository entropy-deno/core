import { Configurator } from '../configurator/configurator.module.ts';
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
      Deno.consoleSize().columns - outputWidth - 3,
    );

    console.error(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: red',
      'color: lightgray',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length,
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
      Deno.consoleSize().columns - outputWidth - 3,
    );

    console.log(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: blue',
      'color: lightgray',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length,
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

    const output = `%c${badge[0]?.toUpperCase() ?? ''}${
      badge.slice(1) ?? ''
    } %c${message}${
      additionalInfo
        ? ` %c${
          this.configurator.entries.isDenoDeploy ? '•' : '.'.repeat(
            Deno.consoleSize().columns - message.replaceAll('%c', '').length -
              additionalInfo.length - badge.length - this.rightPadding,
          )
        } ${additionalInfo}`
        : ''
    }`;

    console.log(
      output,
      'color: blue',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
      'color: gray',
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
      Deno.consoleSize().columns - outputWidth - 3,
    );

    console.warn(
      `%c${badge[0]?.toUpperCase() ?? ''}${
        badge.slice(1) ?? ''
      } %c${trimmedMessage}${exceedsSpace ? '...' : ''}`,
      'color: orange',
      'color: lightgray',
      ...colors.slice(
        0,
        trimmedMessage.match(/%c/g)?.length,
      ).map((color) => `color: ${color}`),
    );
  }
}
