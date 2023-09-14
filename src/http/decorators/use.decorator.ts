import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Middleware } from '../interfaces/middleware.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Use(middleware: Constructor<Middleware>[]): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Constructor<Middleware>[]>(
      'middleware',
      middleware,
      descriptor.value as object,
    );

    return descriptor;
  };
}
