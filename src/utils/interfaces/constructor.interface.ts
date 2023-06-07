export interface Constructor<T = unknown> {
  new (...args: unknown[]): T;
}
