import { Pipe } from './interfaces/pipe.interface.ts';

export class PercentPipe implements Pipe<string> {
  public readonly alias = 'percent';

  public transform(value: string): string {
    return `${parseFloat(value) * 100}%`;
  }
}
