import { Pipe } from './interfaces/pipe.interface.ts';
import { Utils } from '../utils/utils.class.ts';

export class ConstantCasePipe implements Pipe {
  public readonly alias = 'constant';

  public transform(value: string) {
    return Utils.caseConstant(value);
  }
}
