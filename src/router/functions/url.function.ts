import { inject } from '../../injector/functions/inject.function.ts';
import { RoutePath } from '../types/route_path.type.ts';
import { Router } from '../router.service.ts';
import { Url } from '../types/url.type.ts';

const router = inject(Router);

export function url(route?: RoutePath | { name: string }): Url {
  return router.routeUrl(route);
}
