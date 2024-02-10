import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Name(name: string): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<string>(
      'name',
      name,
      originalMethod,
    );

    return originalMethod;
  };
}
