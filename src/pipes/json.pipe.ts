import { Pipe } from './interfaces/pipe.interface.ts';

export class JsonPipe implements Pipe<object> {
  public readonly alias = 'json';

  public transform(value: string): object {
    return JSON.parse(value);
  }
}
