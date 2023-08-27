import { Reflector } from '../../utils/reflector.class.ts';
import { HttpStatus } from '../enums/http_status.enum.ts';

export function StatusCode(statusCode: HttpStatus): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<HttpStatus>(
      'statusCode',
      statusCode,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
