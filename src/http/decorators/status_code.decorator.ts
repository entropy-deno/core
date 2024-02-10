import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';
import { HttpStatus } from '../enums/http_status.enum.ts';

export function StatusCode(statusCode: HttpStatus): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<HttpStatus>(
      'statusCode',
      statusCode,
      originalMethod,
    );

    return originalMethod;
  };
}
