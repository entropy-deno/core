import { Pipe } from './interfaces/pipe.interface.ts';

export class IntPipe implements Pipe<number> {
  public readonly alias = 'int';

  public transform(value: string): number {
    return parseInt(value);
  }
}
