import { ClassDecorator } from '../../utils/types/class_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Channel(name: string): ClassDecorator {
  return (originalClass) => {
    Reflector.defineMetadata<string>('name', name, originalClass);
  };
}
