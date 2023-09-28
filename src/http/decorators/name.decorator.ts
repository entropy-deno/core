import { Reflector } from '../../utils/reflector.class.ts';

export function Name(name: string): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<string>(
      'name',
      name,
      descriptor.value as object,
    );

    return descriptor;
  };
}
