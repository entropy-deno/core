import { Pipe } from './interfaces/pipe.interface.ts';

export class JsonPipe implements Pipe<object> {
  public transform(value: string): object {
    return JSON.parse(value);
  }
}
