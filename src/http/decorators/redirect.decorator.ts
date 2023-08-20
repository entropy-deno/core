import { Reflector } from '../../utils/reflector.class.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';
import { Url } from '../../router/types/url.type.ts';

export function Redirect(
  destination: RoutePath | Url | {
    name: string;
    params?: Record<string, string>;
  },
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata(
      'redirectDestination',
      destination,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
