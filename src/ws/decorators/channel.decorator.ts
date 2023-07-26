import { Reflector } from '../../utils/reflector.class.ts';

export function Channel(name: string): ClassDecorator {
  return (target: object) => {
    Reflector.defineMetadata<string>('name', name, target);
  };
}
