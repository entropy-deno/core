import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { RoutePath } from '../types/route_path.type.ts';

export interface RouteDefinition {
  action: (...args: unknown[]) => unknown;
  method: HttpMethod | `${HttpMethod}`;
  path: RoutePath;
}
