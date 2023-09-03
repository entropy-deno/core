import { Configurator } from '../../configurator/configurator.service.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { RoutePath } from '../types/route_path.type.ts';
import { Router } from '../router.service.ts';
import { Url } from '../types/url.type.ts';

const configurator = inject(Configurator);
const router = inject(Router);

export function url(route?: RoutePath | { name: string }): Url {
  return `${
    configurator.entries.tls.enabled ? 'https' : 'http'
  }://${configurator.entries.host}${
    configurator.entries.isProduction ? '' : `:${configurator.entries.port}`
  }${!route || typeof route === 'string' && route[0] === '/' ? '' : '/'}${
    typeof route === 'string' || !route
      ? route ?? ''
      : router.namedRoutePath(route.name)
  }`;
}
