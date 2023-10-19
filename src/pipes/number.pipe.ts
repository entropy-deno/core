import { Pipe } from './interfaces/pipe.interface.ts';

export class NumberPipe implements Pipe<number> {
  public readonly alias = 'number';

  public transform(value: string): number {
    return Number(value);
  }
}
