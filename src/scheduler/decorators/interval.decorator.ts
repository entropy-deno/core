import { inject } from '../../injector/functions/inject.function.ts';
import { Scheduler } from '../scheduler.service.ts';

export function Interval(milliseconds: number): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    const scheduler = inject(Scheduler);

    const callback = () => {
      (descriptor.value as () => unknown)();
    };

    scheduler.interval(callback, milliseconds);

    return descriptor;
  };
}
