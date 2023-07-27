import { Pipe } from '../interfaces/pipe.interface.ts';

export class FloatPipe implements Pipe<number> {
  public transform(value: string): number {
    return parseFloat(value);
  }
}
