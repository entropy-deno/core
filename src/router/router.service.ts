import { contentType } from '@std/media_types/mod.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Controller } from '../http/interfaces/controller.interface.ts';
import { createResponse } from '../http/functions/create_response.function.ts';
import { env } from '../utils/functions/env.function.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { errorPage } from '../error_handler/pages/error_page.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { MethodDecorator } from '../utils/types/method_decorator.type.ts';
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
  private readonly errorHandler = inject(ErrorHandler);

  private readonly routes = new Map<RegExp, RouteDefinition>();

  private readonly templateCompiler = inject(TemplateCompiler);

  private async abortResponse(
    request: Request,
    status = StatusCode.NotFound,
  ): Promise<Response> {
    const payload = {
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
    };

    if (
      request.headers.get('x-requested-with')?.toLowerCase() === 'xmlhttprequest' ||
      request.headers.get('accept')?.includes('application/json')
    ) {
      return createResponse(JSON.stringify(payload), {
        status,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    return createResponse(
      await this.templateCompiler.compile(statusPage, payload),
      {
        status,
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
        if (context.private) {
          throw new Error(
            `Controller route method ${context.name.toString()} must be public`,
          );
        }

        if (context.static) {
          throw new Error(
            `Controller route method ${context.name.toString()} cannot be static`,
          );
        }

        if (context.kind !== 'method') {
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
          originalMethod,
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

  public registerController(controller: Constructor<Controller>): void {
    const instance = inject(controller);

    for (const { action, methods, path } of instance.routes) {
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

              case ['boolean', 'number', 'string', 'undefined'].includes(
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
      this.errorHandler.handle(error);

      return env<boolean>('DEVELOPMENT')
        ? createResponse(
          await this.templateCompiler.compile(errorPage, {
            error,
          }),
          {
            status: StatusCode.InternalServerError,
          },
        )
        : await this.abortResponse(request, StatusCode.InternalServerError);
    }
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
