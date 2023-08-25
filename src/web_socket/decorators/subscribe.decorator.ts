import { Reflector } from '../../utils/reflector.class.ts';

export function Subscribe(event: string): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<string>(
      'subscribeEvent',
      event,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
