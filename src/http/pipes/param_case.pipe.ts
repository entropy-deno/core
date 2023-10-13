import { Pipe } from '../interfaces/pipe.interface.ts';
import { Utils } from '../../utils/utils.class.ts';

export class ParamCasePipe implements Pipe {
  public transform(value: string) {
    return Utils.caseParam(value);
  }
}
