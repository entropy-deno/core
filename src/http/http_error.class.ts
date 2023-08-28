import { HttpStatus } from './enums/http_status.enum.ts';
import { Utils } from '../utils/utils.class.ts';

export class HttpError extends Error {
  public override readonly name = 'HttpError';

  constructor(
    public readonly statusCode = HttpStatus.NotFound,
    customMessage?: string,
    options: ErrorOptions = {},
  ) {
    const message = customMessage ??
      Utils.getEnumKey(statusCode, HttpStatus).replace(
        /([a-z])([A-Z])/g,
        '$1 $2',
      ) ??
      'Error';

    super(message, options);

    this.message = message;
  }
}
