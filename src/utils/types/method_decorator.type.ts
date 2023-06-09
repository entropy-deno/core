export type MethodDecorator<T = unknown> = (
  originalMethod: (...args: unknown[]) => unknown,
  context: ClassMethodDecoratorContext,
) => void | ((...args: unknown[]) => unknown) | TypedPropertyDescriptor<T>;
