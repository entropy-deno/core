import { inject } from '../../injector/functions/inject.function.ts';
import { RoutePath } from '../types/route_path.type.ts';
import { RouteStore } from '../route_store.service.ts';
import { Url } from '../types/url.type.ts';

const routeStore = inject(RouteStore);

export function url(
  route: RoutePath | { name: string },
  queryParams: Record<string, string> = {},
): Url {
  return routeStore.url(route, queryParams);
}
