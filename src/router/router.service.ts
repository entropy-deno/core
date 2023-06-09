import { contentType } from '@std/media_types/mod.ts';
import { createElement } from 'https://jspm.dev/react@18.0.0';
import { renderToString as renderJsx } from 'https://jspm.dev/react-dom@18.0.0/server';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Reflect } from '../utils/reflect.class.ts';
import { RouteDefinition } from './interfaces/route_definition.interface.ts';
import { RouteOptions } from './interfaces/route_options.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { StatusCode } from '../http/enums/status_code.enum.ts';
import { StatusPage } from '../http/pages/status_page.tsx';
import { ValuesUnion } from '../utils/types/values_union.type.ts';

type RouteDecoratorFunction<T> = T extends ValuesUnion<HttpMethod>[] ? (
    path: RoutePath,
    options?: RouteOptions,
  ) => MethodDecorator
  : (
    methods: ValuesUnion<HttpMethod>[],
    path: RoutePath,
    options?: RouteOptions,
  ) => MethodDecorator;

export class Router {
  private readonly routes = new Map<RegExp, RouteDefinition>();

  private abortResponse(status = StatusCode.NotFound): Response {
    return new Response(
      renderJsx(
        createElement(StatusPage, {
          status,
          message: Object.keys(StatusCode)
            .find(
              (key: string) =>
                (StatusCode as unknown as Record<string, StatusCode>)[
                  key
                ] ===
                  status,
            )
            ?.replace(/([a-z])([A-Z])/g, '$1 $2') ??
            'Error',
        }),
      ).replaceAll('<!-- -->', ''),
      {
        status: status,
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      },
    );
  }

  private async handleStaticFileRequest(request: Request): Promise<Response> {
    const filePath = `public${new URL(request.url).pathname}`;

    try {
      const fileSize = (await Deno.stat(filePath)).size;
      const body = (await Deno.open(filePath)).readable;

      return new Response(body, {
        headers: {
          'content-length': fileSize.toString(),
          'content-type': contentType(filePath.split('.')?.pop() ?? '') ??
            'application/octet-stream',
        },
      });
    } catch {
      return this.abortResponse(StatusCode.NotFound);
    }
  }

  private resolvePathRegexp(path: RoutePath): RegExp {
    const definedParams = path.match(/\/:(\w+)/g);
    const validatedParams: string[] = [];

    for (const param of definedParams ?? []) {
      const name = param[1];

      if (validatedParams.includes(name)) {
        throw new Error(`Duplicate route parameter name: ${name}`);
      }

      validatedParams.push(name);
    }

    return new RegExp(
      `^${
        path.replace(/(.+)\/$/, '$1\\/?').replace(
          /\/:(\w+)\?/g,
          '/(?<$1>.+)\\?',
        ).replace(/\/:(\w+)/g, '/(?<$1>.+)')
      }(\\?.*)?$`,
    );
  }

  public createRouteDecorator<
    T extends ValuesUnion<HttpMethod>[] | undefined = undefined,
  >(httpMethods?: T): RouteDecoratorFunction<T> {
    const decoratorCallback = (
      path: RoutePath,
      methods: ValuesUnion<HttpMethod>[],
      options: RouteOptions = {},
    ): MethodDecorator => {
      return (originalMethod, context) => {
        if ((context as unknown as ClassMethodDecoratorContext).private) {
          throw new Error(
            `Controller route method ${
              (context as unknown as ClassMethodDecoratorContext).name.toString()
            } must be public`,
          );
        }

        if ((context as unknown as ClassMethodDecoratorContext).static) {
          throw new Error(
            `Controller route method ${
              (context as unknown as ClassMethodDecoratorContext).name.toString()
            } cannot be static`,
          );
        }

        if ((context as unknown as ClassMethodDecoratorContext).kind !== 'method') {
          throw new Error(
            'Route decorators can only be used for controller methods',
          );
        }

        Reflect.defineMetadata<Partial<RouteDefinition>>(
          'routeDefinition',
          {
            methods,
            path,
            ...options,
          },
          originalMethod as ((...args: unknown[]) => unknown),
        );

        return originalMethod;
      };
    };

    return (
      Array.isArray(httpMethods)
        ? (
          path: RoutePath,
          options: RouteOptions = {},
        ) => {
          return decoratorCallback(path, httpMethods, options);
        }
        : (
          methods: ValuesUnion<HttpMethod>[],
          path: RoutePath,
          options: RouteOptions = {},
        ) => {
          return decoratorCallback(path, methods, options);
        }
    ) as RouteDecoratorFunction<T>;
  }

  public registerController(controller: Constructor): void {
    const properties = Object.getOwnPropertyNames(controller.prototype);

    const controllerRouteMethods = properties.filter((property) => {
      return (
        typeof controller.prototype[property] === 'function' &&
        !['constructor', 'toString', 'toLocaleString'].includes(property) &&
        !property.startsWith('_')
      );
    });

    for (const controllerRouteMethod of controllerRouteMethods) {
      const { methods, path } = Reflect.getMetadata<
        Exclude<RouteDefinition, 'action'>
      >(
        'routeDefinition',
        controller.prototype[controllerRouteMethod],
      )!;

      this.registerRoute(path, methods, async (...args: unknown[]) => {
        const methodResult =
          (inject(controller) as Record<string, (...args: unknown[]) => unknown>)
            [controllerRouteMethod](...args);

        return methodResult instanceof Promise ? await methodResult : methodResult;
      });
    }
  }

  public async respond(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    let response = this.abortResponse(StatusCode.NotFound);

    routeLookupLoop:
    for (const [pathRegexp, { action, methods }] of this.routes) {
      if (!methods.includes(request.method as HttpMethod)) {
        continue;
      }

      for (const method of methods) {
        if (request.method === method && pathRegexp.test(pathname)) {
          const resolvedParams = Object.values(
            pathRegexp.exec(pathname)?.groups ?? {},
          );

          const body = await action(resolvedParams);

          response = new Response(body as string, {
            headers: {
              'content-type': 'text/html; charset=utf-8',
            },
          });

          if (request.method === HttpMethod.Get && pathname.includes('.')) {
            return await this.handleStaticFileRequest(request);
          }

          break routeLookupLoop;
        }
      }
    }

    return response;
  }

  public registerRoute(
    path: RoutePath,
    methods: ValuesUnion<HttpMethod>[],
    action: (...args: unknown[]) => Promise<unknown>,
  ): void {
    const pathRegexp = this.resolvePathRegexp(path);

    if (this.routes.has(pathRegexp)) {
      throw new Error(`Duplicate route path: ${path}`);
    }

    this.routes.set(pathRegexp, {
      action,
      methods,
      path,
    });
  }
}
