import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Headers(headers: Record<string, string>): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<Record<string, string>>(
      'headers',
      headers,
      originalMethod,
    );

    return originalMethod;
  };
}
