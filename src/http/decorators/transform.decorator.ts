import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Pipe } from '../../pipes/interfaces/pipe.interface.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Transform(
  pipes: Record<string, Constructor<Pipe>>,
): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<Record<string, Constructor<Pipe>>>(
      'pipes',
      pipes,
      originalMethod,
    );

    return originalMethod;
  };
}
