import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Middleware } from '../interfaces/middleware.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Use(
  middleware: Constructor<Middleware> | Constructor<Middleware>[],
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Constructor<Middleware>[]>(
      'middleware',
      Array.isArray(middleware) ? middleware : [middleware],
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
