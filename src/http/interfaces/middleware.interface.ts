export interface Middleware {
  handle: () => void | Promise<void>;
}
