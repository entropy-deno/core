export type MethodDecorator<TTarget = unknown> = (
  originalMethod: (...args: unknown[]) => unknown,
  context: ClassMethodDecoratorContext,
) =>
  | void
  | ((...args: unknown[]) => unknown)
  | TypedPropertyDescriptor<TTarget>;
