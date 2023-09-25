import { Reflector } from '../../utils/reflector.class.ts';

export function InjectRequest(): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<boolean>(
      'injectRequest',
      true,
      descriptor.value as object,
    );

    return descriptor;
  };
}
