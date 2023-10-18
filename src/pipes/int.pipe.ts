import { Pipe } from './interfaces/pipe.interface.ts';

export class IntPipe implements Pipe<number> {
  public transform(value: string): number {
    return parseInt(value);
  }
}
