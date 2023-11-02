import { inject } from '../../injector/functions/inject.function.ts';
import { Scheduler } from '../scheduler.service.ts';

export function Schedule(
  identifier: string,
  schedule: string,
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    const scheduler = inject(Scheduler);

    const callback = () => {
      (descriptor.value as () => unknown)();
    };

    scheduler.schedule(identifier, callback, schedule);

    return descriptor;
  };
}
