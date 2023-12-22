import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../router/controller.class.ts';
import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { HttpRequest } from '../../http/http_request.class.ts';
import { HttpStatus } from '../../http/enums/http_status.enum.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { RoutePath } from '../../router/types/route_path.type.ts';
import { Router } from '../../router/router.service.ts';
import { url } from '../../router/functions/url.function.ts';

interface ResponseData {
  statusCode: HttpStatus;
  body: string;
}

const router = inject(Router);

export async function fetchRoute(
  path: RoutePath,
  controller: Constructor<Controller>,
  method = HttpMethod.Get,
): Promise<ResponseData> {
  router.registerController(controller);

  const request = new Request(url(path), {
    method,
  });

  const httpRequest = new HttpRequest(request);
  const response = await router.respond(httpRequest);

  return {
    body: await response.text(),
    statusCode: response.status,
  };
}
