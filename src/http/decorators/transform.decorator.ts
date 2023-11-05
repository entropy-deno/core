import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Pipe } from '../../pipes/interfaces/pipe.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Transform(
  pipes: Record<string, Constructor<Pipe>>,
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<Record<string, Constructor<Pipe>>>(
      'pipes',
      pipes,
      descriptor.value as object,
    );

    return descriptor;
  };
}
