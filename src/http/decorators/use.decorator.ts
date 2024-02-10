import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Middleware } from '../interfaces/middleware.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Use(middleware: Constructor<Middleware>[]): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<Constructor<Middleware>[]>(
      'middleware',
      middleware,
      originalMethod,
    );

    return originalMethod;
  };
}
