export interface Pipe<TData = unknown> {
  alias?: string;
  transform: (value: string) => TData;
}
