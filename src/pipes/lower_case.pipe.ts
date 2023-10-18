import { Pipe } from './interfaces/pipe.interface.ts';

export class LowerCasePipe implements Pipe {
  public transform(value: string) {
    return value.toLowerCase();
  }
}
