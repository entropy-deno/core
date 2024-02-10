import { inject } from '../../injector/functions/inject.function.ts';
import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Scheduler } from '../scheduler.service.ts';

export function Schedule(
  identifier: string,
  schedule: string | Deno.CronSchedule,
): MethodDecorator {
  return (originalMethod) => {
    const scheduler = inject(Scheduler);

    const callback = () => {
      originalMethod();
    };

    scheduler.schedule(identifier, callback, schedule);

    return originalMethod;
  };
}
