import { HttpRequest } from '../http_request.class.ts';

export interface Middleware {
  handle: (request: HttpRequest) => void | Promise<void>;
}
