import { Reflector } from '../../utils/reflector.class.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';

export function BasePath(path: RoutePath): ClassDecorator {
  return (target: object) => {
    Reflector.defineMetadata<RoutePath>('basePath', path, target);
  };
}
