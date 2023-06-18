import { enumKey } from '../utils/functions/enum_key.function.ts';
import { StatusCode } from './enums/status_code.enum.ts';

export class HttpError extends Error {
  public override readonly name = 'HttpError';

  constructor(public readonly statusCode = StatusCode.NotFound, customMessage?: string) {
    const message = customMessage ??
      enumKey(statusCode, StatusCode).replace(/([a-z])([A-Z])/g, '$1 $2') ?? 'Error';

    super(message);

    this.message = message;
  }
}
