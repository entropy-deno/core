import { HttpStatus } from '../../http/enums/http_status.enum.ts';
import { RoutePath } from '../types/route_path.type.ts';

export interface RouteOptions {
  headers?: Record<string, string>;
  name?: string;
  redirectTo?: RoutePath;
  statusCode?: HttpStatus;
}
