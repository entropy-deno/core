import { Pipe } from './interfaces/pipe.interface.ts';
import { Utils } from '../utils/utils.class.ts';

export class KebabCasePipe implements Pipe {
  public readonly alias = 'kebab';

  public transform(value: string) {
    return Utils.toKebabCase(value);
  }
}
