import { Pipe } from './interfaces/pipe.interface.ts';
import { Utils } from '../utils/utils.class.ts';

export class PascalCasePipe implements Pipe {
  public readonly alias = 'pascal';

  public transform(value: string) {
    return Utils.casePascal(value);
  }
}
