import { contentType } from 'https://deno.land/std@0.198.0/media_types/content_type.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Controller } from '../http/controller.class.ts';
import { EnumValuesUnion } from '../utils/types/enum_values_union.type.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { errorPage } from '../error_handler/pages/error.page.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Middleware } from '../http/interfaces/middleware.interface.ts';
import { Reflector } from '../utils/reflector.class.ts';
import { Route } from './interfaces/route.interface.ts';
import { RouteOptions } from './interfaces/route_options.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { Pipe } from '../http/interfaces/pipe.interface.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { statusPage } from '../http/pages/status.page.ts';
import { TemplateCompiler } from '../templates/template_compiler.service.ts';
import { Utils } from '../utils/utils.class.ts';
import { ValidationRules } from '../validator/interfaces/validation_rules.interface.ts';
import { Validator } from '../validator/validator.service.ts';
import { ViewResponse } from '../http/view_response.class.ts';

interface ResponseOptions {
  headers: HeadersInit;
  statusCode: HttpStatus;
}

type RouteDecoratorFunction<THttpMethods> = THttpMethods extends
  EnumValuesUnion<HttpMethod>[] ? (
    path: RoutePath,
    options?: RouteOptions,
  ) => MethodDecorator
  : (
    methods: EnumValuesUnion<HttpMethod>[],
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

  private readonly routes = new Map<string, Route>();

  private readonly templateCompiler = inject(TemplateCompiler);

  private readonly validator = inject(Validator);

  private async createAbortResponse(
    request: HttpRequest,
    statusCode = HttpStatus.NotFound,
  ): Promise<Response> {
    const payload = {
      statusCode,
      message: Utils.enumKey(statusCode, HttpStatus).replace(
        /([a-z])([A-Z])/g,
        '$1 $2',
      ) ??
        'Error',
    };

    if (request.isAjax) {
      return this.createResponse(request, JSON.stringify(payload), {
        statusCode,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      });
    }

    return this.createResponse(
      request,
      await this.templateCompiler.render(statusPage, payload, {}, request),
      {
        statusCode,
      },
    );
  }

  private createSeoRobotsFile(request: HttpRequest): Response {
    const directives: [string, string][] = [
      ['User-agent', '*'],
      ['Allow', '*'],
      ['Sitemap', `${request.origin}/sitemap.xml`],
    ];

    return this.createResponse(
      request,
      directives.map(([key, value]) => `${key}: ${value}`).join(
        '\n',
      ),
      {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      },
    );
  }

  private async handleStaticFileRequest(
    request: HttpRequest,
  ): Promise<Response> {
    const filePath = `public${request.path}`;

    try {
      const fileSize = (await Deno.stat(filePath)).size;
      const body = (await Deno.open(filePath)).readable;

      return this.createResponse(request, body, {
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

  private async parseResponse(
    request: HttpRequest,
    body: unknown,
    statusCode = HttpStatus.Ok,
  ): Promise<Response> {
    let contentType = 'text/html';

    if (body instanceof Promise) {
      body = await body;
    }

    switch (true) {
      case ['bigint', 'boolean', 'number', 'string', 'symbol', 'undefined']
        .includes(
          typeof body,
        ) ||
        body === null: {
        body = String(body);

        break;
      }

      case body instanceof Response: {
        return body as Response;
      }

      case body instanceof ViewResponse: {
        const template = await (body as ViewResponse).template();
        const compiledTemplate = await this.templateCompiler.render(
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

      default: {
        throw new Error('Invalid response type');
      }
    }

    return this.createResponse(request, body as string, {
      statusCode,
      headers: {
        'content-type': `${contentType}; charset=utf-8`,
      },
    });
  }

  public createResponse(
    request: HttpRequest,
    body: ReadableStream | XMLHttpRequestBodyInit | null,
    { headers = {}, statusCode = HttpStatus.Ok }: Partial<ResponseOptions> = {},
  ): Response {
    const cspDirectives = ` ${
      this.configurator.entries.contentSecurityPolicy.allowedOrigins.join(' ')
    } ${
      this.configurator.entries.isProduction
        ? ''
        : `${
          this.configurator.entries.tls.enabled ? 'https' : 'http'
        }://${this.configurator.entries.host}:* ${
          this.configurator.entries.tls.enabled ? 'wss' : 'ws'
        }://${this.configurator.entries.host}:*`
    }`;

    const csp = {
      'base-uri': `'self'`,
      'connect-src': `'self' 'nonce-${request.nonce}' ${cspDirectives}`,
      'default-src': `'self' 'nonce-${request.nonce}' ${cspDirectives}`,
      'font-src':
        `'self' 'nonce-${request.nonce}' ${cspDirectives} https: data:`,
      'form-action': `'self'`,
      'frame-ancestors': `'self'`,
      'img-src': '*',
      'media-src': `'self'`,
      'object-src': `'none'`,
      'script-src': `'self' ${
        this.configurator.entries.contentSecurityPolicy.allowInlineScripts
          ? `'unsafe-inline'`
          : `'nonce-${request.nonce}'`
      } ${cspDirectives}`,
      'script-src-attr': `'${
        this.configurator.entries.contentSecurityPolicy.allowInlineScripts
          ? 'unsafe-inline'
          : 'none'
      }'`,
      'style-src': `'self' ${
        this.configurator.entries.contentSecurityPolicy.allowInlineStyles
          ? `'unsafe-inline'`
          : `'nonce-${request.nonce}'`
      } ${cspDirectives}`,
      'upgrade-insecure-requests': '',
    };

    const { cors } = this.configurator.entries;

    const securityHeaders = {
      'access-control-allow-credentials': String(cors.allowCredentials),
      'access-control-allow-headers': cors.allowedHeaders.length
        ? cors.allowedHeaders.join(',')
        : (request.header('access-control-request-headers') ?? ''),
      ...(cors.allowedMethods.length && {
        'access-control-allow-methods': cors.allowedMethods.join(','),
      }),
      ...((cors.allowedOrigins.length &&
        cors.allowedOrigins.includes(request.header('origin') as string)) && {
        'access-control-allow-origin': cors.allowedOrigins[0] === '*'
          ? '*'
          : request.header('origin') ?? 'false',
      }),
      ...(cors.exposedHeaders.length && {
        'access-control-expose-headers': cors.exposedHeaders.join(','),
      }),
      'access-control-max-age': String(cors.maxAge),
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
      ...(!cors.allowedMethods.includes('*') && {
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
    THttpMethods extends EnumValuesUnion<HttpMethod>[] | undefined = undefined,
  >(httpMethods?: THttpMethods): RouteDecoratorFunction<THttpMethods> {
    const decoratorCallback = (
      path: RoutePath,
      methods: EnumValuesUnion<HttpMethod>[],
      options: RouteOptions = {},
    ): MethodDecorator => {
      return (_target, _methodName, descriptor) => {
        Reflector.defineMetadata<Partial<Route>>(
          'Route',
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
          methods: EnumValuesUnion<HttpMethod>[],
          path: RoutePath,
          options: RouteOptions = {},
        ) => {
          return decoratorCallback(path, methods, options);
        }
    ) as RouteDecoratorFunction<THttpMethods>;
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
        Exclude<Route, 'action'>
      >(
        'Route',
        controllerMethod,
      )!;

      this.registerRoute(path, methods, async (...args: unknown[]) => {
        const request = args[0] as HttpRequest;
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
              ? `${request.origin}${redirectUrl}`
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
            if (request.isAjax) {
              return this.createResponse(
                request,
                JSON.stringify({
                  errors,
                }),
                {
                  statusCode: HttpStatus.BadRequest,
                  headers: {
                    'content-type': 'application/json; charset=utf-8',
                  },
                },
              );
            }

            return Response.redirect(
              request.headers.get('referer') ?? request.url,
            );
          }
        }

        const paramPipes = Reflector.getMetadata<
          Record<string, Constructor<Pipe>>
        >('paramPipes', controllerMethod);

        const urlPattern = new URLPattern({
          pathname: path,
        });

        const groups = urlPattern.exec(request.url)?.pathname.groups ?? {};

        if (paramPipes) {
          for (const [paramName, pipe] of Object.entries(paramPipes)) {
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
          [controllerRouteMethod](request, ...Object.values(groups));

        return methodResult instanceof Promise
          ? await methodResult
          : methodResult;
      });
    }
  }

  public registerControllers(controllers: Constructor<Controller>[]): void {
    for (const controller of controllers) {
      this.registerController(controller);
    }
  }

  public async respond(request: HttpRequest): Promise<Response> {
    try {
      const requestMethod = await request.method();

      for (const [path, { action, methods }] of this.routes) {
        if (!methods.includes(requestMethod)) {
          continue;
        }

        const urlPattern = new URLPattern({
          pathname: path,
        });

        for (const method of methods) {
          if (requestMethod === method && urlPattern.test(request.url)) {
            const resolvedParams = Object.values(
              urlPattern.exec(request.url)?.pathname.groups ?? {},
            );

            return await this.parseResponse(
              request,
              await action(request, ...resolvedParams),
            );
          }
        }
      }

      if (
        requestMethod === HttpMethod.Get &&
        request.path.includes('.')
      ) {
        if (request.path === '/robots.txt') {
          return this.createSeoRobotsFile(request);
        }

        return await this.handleStaticFileRequest(request);
      }

      throw new HttpError(HttpStatus.NotFound);
    } catch (error) {
      if (!(error instanceof HttpError)) {
        this.errorHandler.handle(error as Error, false);
      }

      const { statusCode } = error;

      if (
        this.configurator.entries.isProduction || error instanceof HttpError
      ) {
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
          (error as HttpError).statusCode,
        );
      }

      return this.createResponse(
        request,
        await this.templateCompiler.render(
          errorPage,
          {
            error,
          },
          {},
          request,
        ),
        {
          statusCode: HttpStatus.InternalServerError,
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
    methods: EnumValuesUnion<HttpMethod>[],
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
