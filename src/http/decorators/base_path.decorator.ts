import { ClassDecorator } from '../../utils/types/class_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';

export function BasePath(path: RoutePath): ClassDecorator {
  return (originalClass) => {
    Reflector.defineMetadata<RoutePath>('basePath', path, originalClass);

    return originalClass;
  };
}
