import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Render(view: string): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<string>(
      'view',
      view,
      originalMethod,
    );

    return originalMethod;
  };
}
