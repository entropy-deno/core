import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';

export function Schedule(
  identifier: string,
  schedule: string | Deno.CronSchedule,
): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<[string, string | Deno.CronSchedule]>(
      'schedule',
      [identifier, schedule],
      originalMethod,
    );

    return originalMethod;
  };
}
