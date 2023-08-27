import { Pipe } from '../interfaces/pipe.interface.ts';

export class LowercasePipe implements Pipe {
  public transform(value: string) {
    return value.toLowerCase();
  }
}
