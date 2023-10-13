import { Pipe } from '../interfaces/pipe.interface.ts';
import { Utils } from '../../utils/utils.class.ts';

export class CamelCasePipe implements Pipe {
  public transform(value: string) {
    return Utils.caseCamel(value);
  }
}
