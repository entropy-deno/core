import { contentType } from 'https://deno.land/std@0.196.0/media_types/content_type.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Controller } from '../http/controller.class.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { errorPage } from '../error_handler/pages/error_page.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Middleware } from '../http/interfaces/middleware.interface.ts';
import { Reflector } from '../utils/reflector.class.ts';
import { RouteDefinition } from './interfaces/route_definition.interface.ts';
import { RouteOptions } from './interfaces/route_options.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { Pipe } from '../http/interfaces/pipe.interface.ts';
import { statusPage } from '../http/pages/status_page.ts';
import { TemplateCompiler } from '../template_compiler/template_compiler.service.ts';
import { Utils } from '../utils/utils.class.ts';
import { ValidationRules } from '../validator/interfaces/validation_rules.interface.ts';
import { Validator } from '../validator/validator.service.ts';
import { ValuesUnion } from '../utils/types/values_union.type.ts';
import { ViewResponse } from '../http/view_response.class.ts';

interface ResponseOptions {
  headers: HeadersInit;
  statusCode: HttpStatus;
}

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

  private readonly customHttpHandlers = new Map<
    HttpStatus | undefined,
    (statusCode: HttpStatus) => unknown
  >();

  private readonly errorHandler = inject(ErrorHandler);

  private readonly routes = new Map<string, RouteDefinition>();

  private readonly templateCompiler = inject(TemplateCompiler);

  private readonly validator = inject(Validator);

  private async createAbortResponse(
    request: Request,
    statusCode = HttpStatus.NotFound,
  ): Promise<Response> {
    const payload = {
      statusCode,
      message:
        Utils.enumKey(statusCode, HttpStatus).replace(/([a-z])([A-Z])/g, '$1 $2') ??
          'Error',
    };

    if (this.isAjaxRequest(request)) {
      return this.createResponse(JSON.stringify(payload), {
        statusCode,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      }, request);
    }

    return this.createResponse(
      await this.templateCompiler.render(statusPage, payload),
      {
        statusCode,
      },
      request,
    );
  }

  private async handleStaticFileRequest(request: Request): Promise<Response> {
    const filePath = `public${new URL(request.url).pathname}`;

    try {
      const fileSize = (await Deno.stat(filePath)).size;
      const body = (await Deno.open(filePath)).readable;

      return this.createResponse(body, {
        headers: {
          'content-length': fileSize.toString(),
          'content-type': contentType(filePath.split('.')?.pop() ?? '') ??
            'application/octet-stream',
        },
      });
    } catch {
      throw new HttpError(HttpStatus.NotFound);
    }
  }

  private isAjaxRequest(request: Request): boolean {
    return !!(request.headers.get('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest' ||
      request.headers.get('accept')?.includes('application/json'));
  }

  private async parseResponse(
    request: Request,
    body: unknown,
    statusCode = HttpStatus.Ok,
  ): Promise<Response> {
    let contentType = 'text/html';

    if (body instanceof Promise) {
      body = await body;
    }

    switch (true) {
      case body instanceof Response: {
        return body as Response;
      }

      case body instanceof ViewResponse: {
        const template = await (body as ViewResponse).template();
        const compiledTemplate = await inject(TemplateCompiler).render(
          template,
          (body as ViewResponse).variables,
          {
            file: (body as ViewResponse).file,
            ...(body as ViewResponse).options,
          },
          request,
        );

        body = compiledTemplate;

        break;
      }

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

      default: {
        throw new Error('Invalid response type');
      }
    }

    return this.createResponse(body as string, {
      statusCode,
      headers: {
        'content-type': `${contentType}; charset=utf-8`,
      },
    }, request);
  }

  public createResponse(
    body: ReadableStream | XMLHttpRequestBodyInit | null,
    { headers = {}, statusCode = HttpStatus.Ok }: Partial<ResponseOptions> = {},
    request?: Request,
  ): Response {
    const cspDirectives = ` ${
      this.configurator.entries.cspAllowedOrigins.join(' ')
    } ${
      this.configurator.entries.isProduction
        ? ''
        : `http://${this.configurator.entries.host}:* ws://${this.configurator.entries.host}:*`
    }`;

    const csp = {
      'base-uri': `'self'`,
      'connect-src': `'self' ${cspDirectives}`,
      'default-src': `'self' 'unsafe-inline' ${cspDirectives}`,
      'font-src': `'self' ${cspDirectives} https: data:`,
      'form-action': `'self'`,
      'frame-ancestors': `'self'`,
      'img-src': '*',
      'media-src': `'self'`,
      'object-src': `'none'`,
      'script-src': `'self' 'unsafe-inline' ${cspDirectives}`,
      'script-src-attr': `'unsafe-inline'`,
      'style-src': `'self' 'unsafe-inline' ${cspDirectives}`,
      'upgrade-insecure-requests': '',
    };

    const { corsAllowedHeaders, corsAllowedMethods, corsAllowedOrigins } =
      this.configurator.entries;

    const securityHeaders = {
      'access-control-allow-credentials': String(
        this.configurator.entries.corsAllowCredentials,
      ),
      'access-control-allow-headers': corsAllowedHeaders.length
        ? corsAllowedHeaders.join(',')
        : (request?.headers.get('access-control-request-headers') ?? ''),
      ...(corsAllowedMethods.length && {
        'access-control-allow-methods': corsAllowedMethods.join(','),
      }),
      ...(corsAllowedOrigins.length && {
        'access-control-allow-origin': corsAllowedOrigins.join(','),
      }),
      'access-control-max-age': String(this.configurator.entries.corsMaxAge),
      'content-security-policy': Object.entries(csp).map(([key, value]) =>
        `${key} ${value}`
      ).join(';'),
      'cross-origin-opener-policy': 'same-origin',
      'cross-origin-resource-policy': 'same-origin',
      'origin-agent-cluster': '?1',
      'permissions-policy':
        'autoplay=(self), camera=(), encrypted-media=(self), geolocation=(self), microphone=(), payment=(), sync-xhr=(self)',
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-xss-protection': '0',
      ...(!corsAllowedMethods.includes('*') && {
        'vary': 'origin',
      }),
    };

    return new Response(body, {
      status: statusCode,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        ...securityHeaders,
        ...headers,
      },
    });
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
        Reflector.defineMetadata<Partial<RouteDefinition>>(
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

  public registerController(controller: Constructor): void {
    const properties = Object.getOwnPropertyNames(controller.prototype);

    const controllerRouteMethods = properties.filter((property) => {
      return (
        typeof controller.prototype[property] === 'function' &&
        !['constructor', 'toString', 'toLocaleString'].includes(property) &&
        property[0] !== '_'
      );
    });

    for (const controllerRouteMethod of controllerRouteMethods) {
      const controllerMethod = controller.prototype[controllerRouteMethod];

      const handler = Reflector.getMetadata<{ statusCode?: HttpStatus }>(
        'httpErrorHandler',
        controllerMethod,
      );

      if (handler) {
        this.customHttpHandlers.set(
          handler.statusCode,
          async (statusCode: HttpStatus) => {
            const methodResult = (inject(controller) as unknown as Record<
              string,
              (...args: unknown[]) => unknown
            >)
              [controllerRouteMethod](statusCode);

            return methodResult instanceof Promise
              ? await methodResult
              : methodResult;
          },
        );

        continue;
      }

      const { methods, path } = Reflector.getMetadata<
        Exclude<RouteDefinition, 'action'>
      >(
        'routeDefinition',
        controllerMethod,
      )!;

      this.registerRoute(path, methods, async (...args: unknown[]) => {
        const request = args[0] as Request;
        const middleware = Reflector.getMetadata<Constructor<Middleware>[]>(
          'middleware',
          controllerMethod,
        ) ?? [];

        for (const middlewareHandler of middleware) {
          const result = inject(middlewareHandler).handle();

          if (result instanceof Promise) {
            await result;
          }

          if (result) {
            return result;
          }
        }

        const redirectUrl = Reflector.getMetadata<string>(
          'redirectUrl',
          controllerMethod,
        );

        if (redirectUrl) {
          return Response.redirect(
            redirectUrl[0] === '/'
              ? `${new URL(request.url).origin}${redirectUrl}`
              : redirectUrl,
          );
        }

        const validationRules = Reflector.getMetadata<
          Record<string, Partial<ValidationRules> | Record<string, unknown>>
        >(
          'validationRules',
          controllerMethod,
        );

        if (validationRules) {
          const errors = await this.validator.validate(
            validationRules,
            request,
          );

          if (Object.keys(errors).length > 0) {
            if (this.isAjaxRequest(request)) {
              return this.createResponse(
                JSON.stringify({
                  errors,
                }),
                {
                  statusCode: HttpStatus.BadRequest,
                  headers: {
                    'content-type': 'application/json; charset=utf-8',
                  },
                },
                request,
              );
            }

            return Response.redirect(request.url); // TODO: redirect back
          }
        }

        const transformParams = Reflector.getMetadata<
          Record<string, Constructor<Pipe>>
        >(
          'transformParams',
          controllerMethod,
        );

        const urlPattern = new URLPattern({
          pathname: path,
        });

        const groups = urlPattern.exec(request.url)?.pathname?.groups ?? {};

        if (transformParams) {
          for (const [paramName, pipe] of Object.entries(transformParams)) {
            const transformed = inject(pipe).transform(groups[paramName] ?? '');

            groups[paramName] = transformed instanceof Promise
              ? await transformed
              : transformed;
          }
        }

        const methodResult = (inject(controller) as unknown as Record<
          string,
          (...args: unknown[]) => unknown
        >)
          [controllerRouteMethod](args[0], ...Object.values(groups));

        return methodResult instanceof Promise ? await methodResult : methodResult;
      });
    }
  }

  public registerControllers(controllers: Constructor<Controller>[]): void {
    for (const controller of controllers) {
      this.registerController(controller);
    }
  }

  public async respond(request: Request): Promise<Response> {
    try {
      for (const [path, { action, methods }] of this.routes) {
        if (!methods.includes(request.method as HttpMethod)) {
          continue;
        }

        const urlPattern = new URLPattern({
          pathname: path,
        });

        for (const method of methods) {
          if (request.method === method && urlPattern.test(request.url)) {
            const resolvedParams = Object.values(
              urlPattern.exec(request.url)?.pathname?.groups ?? {},
            );

            return await this.parseResponse(
              request,
              await action(request, ...resolvedParams),
            );
          }
        }
      }

      if (
        request.method === HttpMethod.Get &&
        new URL(request.url).pathname.includes('.')
      ) {
        return await this.handleStaticFileRequest(request);
      }

      throw new HttpError(HttpStatus.NotFound);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        this.errorHandler.handle(error, false);
      }

      const { statusCode } = error;

      if (this.configurator.entries.isProduction || error instanceof HttpError) {
        if (
          this.customHttpHandlers.has(undefined) ||
          this.customHttpHandlers.has(statusCode)
        ) {
          const body = this.customHttpHandlers.get(
            this.customHttpHandlers.has(statusCode) ? statusCode : undefined,
          )?.(statusCode);

          return await this.parseResponse(request, body, statusCode);
        }

        return await this.createAbortResponse(
          request,
          HttpStatus.InternalServerError,
        );
      }

      return this.createResponse(
        await this.templateCompiler.render(errorPage, {
          error,
        }),
        {
          statusCode: HttpStatus.InternalServerError,
        },
        request,
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
    this.routes.set(path, {
      action,
      methods,
      path,
      ...options,
    });
  }
}
