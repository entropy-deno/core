export interface Pipe<TData = unknown> {
  transform: (value: string) => TData;
}
