import { Reflector } from '../../utils/reflector.class.ts';

export function Subscribe(event: string): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<string>(
      'subscribeToEvent',
      event,
      descriptor.value as object,
    );

    return descriptor;
  };
}
