import { Pipe } from './interfaces/pipe.interface.ts';

export class NumberPipe implements Pipe<number> {
  public transform(value: string): number {
    return Number(value);
  }
}
