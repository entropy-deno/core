import { inject } from '../../injector/functions/inject.function.ts';
import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Scheduler } from '../scheduler.service.ts';

export function Timeout(milliseconds: number): MethodDecorator {
  return (originalMethod) => {
    const scheduler = inject(Scheduler);

    const callback = () => {
      originalMethod();
    };

    scheduler.timeout(callback, milliseconds);

    return originalMethod;
  };
}
