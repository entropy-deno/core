import { Reflector } from '../../utils/reflector.class.ts';

export function NonSingleton(): ClassDecorator {
  return (target: object) => {
    Reflector.defineMetadata<boolean>('singleton', false, target);
  };
}
