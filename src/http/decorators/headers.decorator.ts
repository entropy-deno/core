import { Reflector } from '../../utils/reflector.class.ts';

export function Headers(headers: Record<string, string>): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Record<string, string>>(
      'headers',
      headers,
      descriptor.value as object,
    );

    return descriptor;
  };
}
