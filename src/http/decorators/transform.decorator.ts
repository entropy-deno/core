import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Pipe } from '../interfaces/pipe.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Transform(
  transformParams: Record<string, Constructor<Pipe>>,
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Record<string, Constructor<Pipe>>>(
      'transformParams',
      transformParams,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}