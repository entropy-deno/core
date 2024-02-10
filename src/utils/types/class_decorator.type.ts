import { Constructor } from '../interfaces/constructor.interface.ts';

// deno-lint-ignore no-explicit-any
export type ClassDecorator<TTarget extends Constructor = any> = (
  originalClass: Constructor<TTarget>,
  context: ClassDecoratorContext,
) => TTarget;
