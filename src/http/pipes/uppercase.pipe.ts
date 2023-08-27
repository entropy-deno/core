import { Pipe } from '../interfaces/pipe.interface.ts';

export class UppercasePipe implements Pipe {
  public transform(value: string) {
    return value.toUpperCase();
  }
}
