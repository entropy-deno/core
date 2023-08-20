import { Reflector } from '../../utils/reflector.class.ts';
import { RedirectDestination } from '../../router/types/redirect_destination.type.ts';

export function Redirect(destination: RedirectDestination): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<RedirectDestination>(
      'redirectDestination',
      destination,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
