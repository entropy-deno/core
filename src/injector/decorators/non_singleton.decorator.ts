import { ClassDecorator } from '../../utils/types/class_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function NonSingleton(): ClassDecorator {
  return (originalClass) => {
    Reflector.defineMetadata<boolean>('singleton', false, originalClass);
  };
}
