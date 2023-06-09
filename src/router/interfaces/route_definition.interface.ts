import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { RouteOptions } from './route_options.interface.ts';
import { RoutePath } from '../types/route_path.type.ts';
import { ValuesUnion } from '../../utils/types/values_union.type.ts';

export interface RouteDefinition extends RouteOptions {
  action: (...args: unknown[]) => Promise<unknown>;
  methods: ValuesUnion<HttpMethod>[];
  path: RoutePath;
}
