import { Pipe } from '../interfaces/pipe.interface.ts';

export class BoolPipe implements Pipe<boolean> {
  public transform(value: string): boolean {
    if (['1', 'on', 'true', 'yes'].includes(value.toLowerCase())) {
      return true;
    }

    return false;
  }
}
