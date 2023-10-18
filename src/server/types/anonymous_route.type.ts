import { EnumValuesUnion } from '../../utils/types/enum_values_union.type.ts';
import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { RouteOptions } from '../../router/interfaces/route_options.interface.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';

export type AnonymousRoute = [
  RoutePath,
  EnumValuesUnion<HttpMethod>[],
  (...args: unknown[]) => Promise<unknown>,
  RouteOptions | undefined,
];
