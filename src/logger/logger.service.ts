import { Configurator } from '../configurator/configurator.module.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface LogOptions {
  badge?: string;
  colors?: string[];
}

export class Logger {
  private readonly configurator = inject(Configurator);

  public error(
    message: string,
    { badge = 'Error', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    console.error(
      `%c${badge[0]?.toUpperCase() ?? ''}${badge.slice(1) ?? ''} %c${message}`,
      'color: red',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public info(
    message: string,
    { badge = 'Info', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    console.log(
      `%c${badge[0]?.toUpperCase() ?? ''}${badge.slice(1) ?? ''} %c${message}`,
      'color: blue',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public log(
    message: string,
    { badge = 'Log', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    const output = `%c${badge[0]?.toUpperCase() ?? ''}${
      badge.slice(1) ?? ''
    } %c${message}`;

    console.log(
      output,
      'color: blue',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public warn(
    message: string,
    { badge = 'Warning', colors = [] }: LogOptions = {},
  ): void {
    if (!this.configurator.entries.logger) {
      return;
    }

    console.warn(
      `%c${badge[0]?.toUpperCase() ?? ''}${badge.slice(1) ?? ''} %c${message}`,
      'color: orange',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
    );
  }
}
