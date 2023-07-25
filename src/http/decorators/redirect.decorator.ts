import { Reflector } from '../../utils/reflector.class.ts';

export function Redirect(url: string): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<string>(
      'redirectUrl',
      url,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
