import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';
import { RedirectDestination } from '../../router/types/redirect_destination.type.ts';

export function Redirect(destination: RedirectDestination): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<RedirectDestination>(
      'redirectDestination',
      destination,
      originalMethod,
    );

    return originalMethod;
  };
}
