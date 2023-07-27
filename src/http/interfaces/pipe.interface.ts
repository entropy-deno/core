export interface Pipe<T = unknown> {
  transform: (value: string) => T;
}
