import { EnumValuesUnion } from '../../utils/types/enum_values_union.type.ts';
import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { RouteOptions } from './route_options.interface.ts';
import { RoutePath } from '../types/route_path.type.ts';

export interface Route extends RouteOptions {
  action: (...args: unknown[]) => Promise<unknown>;
  methods: EnumValuesUnion<HttpMethod>[];
  path: RoutePath;
}
