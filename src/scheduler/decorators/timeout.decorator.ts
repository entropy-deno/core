import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Timeout(milliseconds: number): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<number>(
      'timeout',
      milliseconds,
      originalMethod,
    );

    return originalMethod;
  };
}
