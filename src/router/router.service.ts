import { contentType } from '@std/media_types/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Controller } from '../http/interfaces/controller.interface.ts';
import { createResponse } from '../http/functions/create_response.function.ts';
import { enumKey } from '../utils/functions/enum_key.function.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { errorPage } from '../error_handler/pages/error_page.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Reflect } from '../utils/reflect.class.ts';
import { RouteDefinition } from './interfaces/route_definition.interface.ts';
import { RouteOptions } from './interfaces/route_options.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { StatusCode } from '../http/enums/status_code.enum.ts';
import { statusPage } from '../http/pages/status_page.ts';
import { TemplateCompiler } from '../template_compiler/template_compiler.service.ts';
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
  private readonly configurator = inject(Configurator);

  private readonly errorHandler = inject(ErrorHandler);

  private readonly routes = new Map<RegExp, RouteDefinition>();

  private readonly templateCompiler = inject(TemplateCompiler);

  private async abortResponse(
    request: Request,
    statusCode = StatusCode.NotFound,
  ): Promise<Response> {
    const payload = {
      statusCode,
      message: enumKey(statusCode, StatusCode).replace(/([a-z])([A-Z])/g, '$1 $2') ??
        'Error',
    };

    if (
      request.headers.get('x-requested-with')?.toLowerCase() === 'xmlhttprequest' ||
      request.headers.get('accept')?.includes('application/json')
    ) {
      return createResponse(JSON.stringify(payload), {
        statusCode,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    return createResponse(
      await this.templateCompiler.compile(statusPage, payload),
      {
        statusCode,
      },
    );
  }

  private async handleStaticFileRequest(request: Request): Promise<Response> {
    const filePath = `public${new URL(request.url).pathname}`;

    try {
      const fileSize = (await Deno.stat(filePath)).size;
      const body = (await Deno.open(filePath)).readable;

      return createResponse(body, {
        headers: {
          'content-length': fileSize.toString(),
          'content-type': contentType(filePath.split('.')?.pop() ?? '') ??
            'application/octet-stream',
        },
      });
    } catch {
      return await this.abortResponse(request, StatusCode.NotFound);
    }
  }

  private resolvePathRegexp(path: RoutePath): RegExp {
    const definedParams = path.match(/\/:(\w+)/g);
    const validatedParams: string[] = [];

    for (const [, name] of definedParams ?? []) {
      if (validatedParams.includes(name)) {
        throw new Error(`Duplicate route parameter name '${name}'`);
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
      return (_target, _methodName, descriptor) => {
        Reflect.defineMetadata<Partial<RouteDefinition>>(
          'routeDefinition',
          {
            methods,
            path,
            ...options,
          },
          descriptor.value as ((...args: unknown[]) => unknown),
        );

        return descriptor;
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

  public registerController(controller: Constructor<Controller>): void {
    const instance = inject(controller);

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

    for (const { action, methods, path } of instance.routes ?? []) {
      this.registerRoute(path, methods, async (...args: unknown[]) => {
        const methodResult =
          (instance as unknown as Record<string, (...args: unknown[]) => unknown>)
            [action](...args);

        return methodResult instanceof Promise ? await methodResult : methodResult;
      });
    }
  }

  public async respond(request: Request): Promise<Response> {
    try {
      const { pathname } = new URL(request.url);

      if (request.method === HttpMethod.Get && pathname.includes('.')) {
        return await this.handleStaticFileRequest(request);
      }

      for (const [pathRegexp, { action, methods }] of this.routes) {
        if (!methods.includes(request.method as HttpMethod)) {
          continue;
        }

        for (const method of methods) {
          if (request.method === method && pathRegexp.test(pathname)) {
            const resolvedParams = Object.values(
              pathRegexp.exec(pathname)?.groups ?? {},
            );

            let body = await action(resolvedParams);
            let contentType = 'text/html';

            switch (true) {
              case body instanceof Response:
                return body as Response;

              case Array.isArray(body) ||
                ((typeof body === 'object' && body !== null) &&
                  (body as Record<string, unknown>).constructor === Object): {
                body = JSON.stringify(body);
                contentType = 'application/json';

                break;
              }

              case ['bigint', 'boolean', 'function', 'number', 'string', 'undefined']
                .includes(
                  typeof body,
                ) ||
                body === null: {
                body = String(body);

                break;
              }

              default:
                throw new Error('Invalid response body type');
            }

            return createResponse(body as string, {
              headers: {
                'content-type': `${contentType}; charset=utf-8`,
              },
            });
          }
        }
      }

      return await this.abortResponse(request, StatusCode.NotFound);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        this.errorHandler.handle(error);
      }

      return this.configurator.entries.isProduction || error instanceof HttpError
        ? await this.abortResponse(request, StatusCode.InternalServerError)
        : createResponse(
          await this.templateCompiler.compile(errorPage, {
            error,
          }),
          {
            statusCode: StatusCode.InternalServerError,
          },
        );
    }
  }

  public any(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, Object.values(HttpMethod), action, options);
  }

  public copy(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Copy], action, options);
  }

  public delete(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Delete], action, options);
  }

  public get(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Get], action, options);
  }

  public head(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Head], action, options);
  }

  public lock(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Lock], action, options);
  }

  public mkcol(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Mkcol], action, options);
  }

  public move(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Move], action, options);
  }

  public options(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Options], action, options);
  }

  public patch(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Patch], action, options);
  }

  public post(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Post], action, options);
  }

  public propFind(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.PropFind], action, options);
  }

  public propPatch(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.PropPatch], action, options);
  }

  public put(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Put], action, options);
  }

  public search(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Search], action, options);
  }

  public trace(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Trace], action, options);
  }

  public unlock(
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, [HttpMethod.Unlock], action, options);
  }

  public registerRoute(
    path: RoutePath,
    methods: ValuesUnion<HttpMethod>[],
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    const pathRegexp = this.resolvePathRegexp(path);

    if (this.routes.has(pathRegexp)) {
      throw new Error(`Duplicate route path: ${path}`);
    }

    this.routes.set(pathRegexp, {
      action,
      methods,
      path,
      ...options,
    });
  }
}
