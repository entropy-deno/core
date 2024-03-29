import { Pipe } from './interfaces/pipe.interface.ts';
import { Utils } from '../utils/utils.class.ts';

export class TitleCasePipe implements Pipe {
  public readonly alias = 'title';

  public transform(value: string) {
    return Utils.toTitleCase(value);
  }
}
