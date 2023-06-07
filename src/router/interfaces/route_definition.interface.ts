import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { RoutePath } from '../types/route_path.type.ts';
import { ValuesUnion } from '../../utils/types/values_union.type.ts';

export interface RouteDefinition {
  action: (...args: unknown[]) => unknown;
  method: ValuesUnion<HttpMethod>;
  path: RoutePath;
}
