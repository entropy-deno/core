import { Pipe } from '../interfaces/pipe.interface.ts';

export class DatePipe implements Pipe<Date> {
  public transform(value: string): Date {
    return new Date(value);
  }
}
