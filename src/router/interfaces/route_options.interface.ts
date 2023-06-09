import { StatusCode } from '../../http/enums/status_code.enum.ts';
import { RoutePath } from '../types/route_path.type.ts';

export interface RouteOptions {
  headers?: Record<string, string>;
  name?: string;
  redirectTo?: RoutePath;
  statusCode?: StatusCode;
}
