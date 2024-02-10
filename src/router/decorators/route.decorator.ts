import { HttpMethod } from '../../http/enums/http_method.enum.ts';
import { HttpStatus } from '../../http/enums/http_status.enum.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';
import { Router } from '../router.service.ts';

const router = inject(Router);

export const Any = router.createRouteDecorator(Object.values(HttpMethod));

export const Copy = router.createRouteDecorator([HttpMethod.Copy]);

export const Delete = router.createRouteDecorator([HttpMethod.Delete]);

export const Get = router.createRouteDecorator([HttpMethod.Get]);

export const Head = router.createRouteDecorator([HttpMethod.Head]);

export const Lock = router.createRouteDecorator([HttpMethod.Lock]);

export const Mkcol = router.createRouteDecorator([HttpMethod.Mkcol]);

export const Move = router.createRouteDecorator([HttpMethod.Move]);

export const Options = router.createRouteDecorator([HttpMethod.Options]);

export const Patch = router.createRouteDecorator([HttpMethod.Patch]);

export const Post = router.createRouteDecorator([HttpMethod.Post]);

export const PropFind = router.createRouteDecorator([HttpMethod.PropFind]);

export const PropPatch = router.createRouteDecorator([HttpMethod.PropPatch]);

export const Put = router.createRouteDecorator([HttpMethod.Put]);

export const Search = router.createRouteDecorator([HttpMethod.Search]);

export const Trace = router.createRouteDecorator([HttpMethod.Trace]);

export const Unlock = router.createRouteDecorator([HttpMethod.Unlock]);

export const Methods = router.createRouteDecorator();

export function Error(
  statusCode?: HttpStatus,
): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<{ statusCode?: HttpStatus }>(
      'httpErrorHandler',
      {
        statusCode,
      },
      originalMethod,
    );

    return originalMethod;
  };
}
