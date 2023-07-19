import { enumKey } from '../utils/functions/enum_key.function.ts';
import { HttpStatus } from './enums/http_status.enum.ts';

export class HttpError extends Error {
  public override readonly name = 'HttpError';

  constructor(
    public readonly statusCode = HttpStatus.NotFound,
    customMessage?: string,
  ) {
    const message = customMessage ??
      enumKey(statusCode, HttpStatus).replace(/([a-z])([A-Z])/g, '$1 $2') ?? 'Error';

    super(message);

    this.message = message;
  }
}
