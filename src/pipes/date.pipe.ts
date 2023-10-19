import { Pipe } from './interfaces/pipe.interface.ts';

export class DatePipe implements Pipe<Date> {
  public readonly alias = 'date';

  public transform(value: string): Date {
    return new Date(value);
  }
}
