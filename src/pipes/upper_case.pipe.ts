import { Pipe } from './interfaces/pipe.interface.ts';

export class UpperCasePipe implements Pipe {
  public readonly alias = 'upper';

  public transform(value: string) {
    return value.toUpperCase();
  }
}
