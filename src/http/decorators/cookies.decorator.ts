import { Reflector } from '../../utils/reflector.class.ts';

export function Cookies(cookies: Record<string, string>): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Record<string, string>>(
      'cookies',
      cookies,
      descriptor.value as object,
    );

    return descriptor;
  };
}
