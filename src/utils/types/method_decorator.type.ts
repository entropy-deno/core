export type MethodDecorator = (
  originalMethod: object | ((...args: unknown[]) => unknown),
  context: ClassMethodDecoratorContext,
  // deno-lint-ignore no-explicit-any
) => any;
