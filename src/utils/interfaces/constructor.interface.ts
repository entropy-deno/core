export interface Constructor<TTarget = unknown> {
  new (...args: unknown[]): TTarget;
}
