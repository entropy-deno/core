import { Pipe } from './interfaces/pipe.interface.ts';

export class AbbreviatePipe implements Pipe<string> {
  public readonly alias = 'abbreviate';

  public transform(value: string): string {
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value.replaceAll(/[ _]/g, '')));
  }
}
