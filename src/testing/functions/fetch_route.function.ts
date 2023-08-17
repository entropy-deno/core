import { Configurator } from '../../configurator/configurator.service.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';
import { HttpRequest } from '../../http/http_request.class.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';
import { Router } from '../../router/router.service.ts';

const configurator = inject(Configurator);
const router = inject(Router);

export async function fetchRoute(
  path: RoutePath,
  controller: Constructor<Controller>,
): Promise<string> {
  router.registerController(controller);

  const request = new Request(
    `${
      configurator.entries.tls.enabled ? 'https' : 'http'
    }://${configurator.entries.host}:${configurator.entries.port}${path}`,
  );
  const httpRequest = new HttpRequest(request);
  const response = await router.respond(httpRequest);

  return await response.text();
}
