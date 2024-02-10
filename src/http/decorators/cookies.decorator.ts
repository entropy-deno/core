import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Cookies(cookies: Record<string, string>): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<Record<string, string>>(
      'cookies',
      cookies,
      originalMethod,
    );

    return originalMethod;
  };
}
