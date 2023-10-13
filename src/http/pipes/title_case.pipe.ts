import { Pipe } from '../interfaces/pipe.interface.ts';
import { Utils } from '../../utils/utils.class.ts';

export class TitleCasePipe implements Pipe {
  public transform(value: string) {
    return Utils.caseTitle(value);
  }
}
