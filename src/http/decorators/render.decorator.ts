import { Reflector } from '../../utils/reflector.class.ts';

export function Render(view: string): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<string>(
      'view',
      view,
      descriptor.value as object,
    );

    return descriptor;
  };
}
