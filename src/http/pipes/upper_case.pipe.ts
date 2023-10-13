import { Pipe } from '../interfaces/pipe.interface.ts';

export class UpperCasePipe implements Pipe {
  public transform(value: string) {
    return value.toUpperCase();
  }
}
