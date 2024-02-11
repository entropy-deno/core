import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Interval(milliseconds: number): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<number>(
      'interval',
      milliseconds,
      originalMethod,
    );

    return originalMethod;
  };
}
