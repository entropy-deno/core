import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Route } from './interfaces/route.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { Url } from './types/url.type.ts';

export class RouteStore {
  private readonly configurator = inject(Configurator);

  public readonly routes: Route[] = [];

  public url(
    route: RoutePath | { name: string },
    queryParams: Record<string, string> = {},
  ): Url {
    let namedRoutePath = '';

    if (typeof route !== 'string') {
      for (const registeredRoute of this.routes) {
        if (registeredRoute.name === route?.name) {
          namedRoutePath = registeredRoute.path;

          break;
        }
      }

      if (!namedRoutePath) {
        throw new Error(`Route with name '${route?.name}' not found`);
      }
    }

    const params = new URLSearchParams(queryParams);

    return `${
      this.configurator.entries.tls.enabled ? 'https' : 'http'
    }://${this.configurator.entries.host}${
      this.configurator.entries.isProduction
        ? ''
        : `:${this.configurator.entries.port}`
    }${!route || typeof route === 'string' && route[0] === '/' ? '' : '/'}${
      typeof route === 'string' || !route ? route ?? '' : namedRoutePath
    }${params.toString() ? `?${params.toString()}` : ''}`;
  }
}
