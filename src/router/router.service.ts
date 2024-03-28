import { contentType } from 'https://deno.land/std@0.221.0/media_types/content_type.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Controller } from './controller.class.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { EnumValuesUnion } from '../utils/types/enum_values_union.type.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { errorPage } from '../error_handler/pages/error.page.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Json } from '../http/json.class.ts';
import { MethodDecorator } from '../utils/types/method_decorator.type.ts';
import { Middleware } from '../http/interfaces/middleware.interface.ts';
import { Pipe } from '../pipes/interfaces/pipe.interface.ts';
import { RedirectDestination } from './types/redirect_destination.type.ts';
import { Reflector } from '../utils/reflector.class.ts';
import { Route } from './interfaces/route.interface.ts';
import { RouteOptions } from './interfaces/route_options.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { RouteStore } from './route_store.service.ts';
import { Scheduler } from '../scheduler/scheduler.service.ts';
import { statusPage } from '../http/pages/status.page.ts';
import { TemplateCompiler } from '../templates/template_compiler.service.ts';
import { TimeUnit } from '../scheduler/enums/time_unit.enum.ts';
import { Url } from './types/url.type.ts';
import { Utils } from '../utils/utils.class.ts';
import { Validator } from '../validator/validator.service.ts';
import { ValidatorRulesList } from '../validator/interfaces/validator_rules_list.interface.ts';
import { View } from '../templates/view.class.ts';

interface ResponseOptions {
  cookies?: Record<string, string>;
  headers?: HeadersInit;
  statusCode?: HttpStatus;
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

  private readonly encrypter = inject(Encrypter);

  private readonly errorHandler = inject(ErrorHandler);

  private readonly routeStore = inject(RouteStore);

  private readonly scheduler = inject(Scheduler);

  private readonly validator = inject(Validator);

  private async createAbortResponse(
    request: HttpRequest,
    statusCode = HttpStatus.NotFound,
  ): Promise<Response> {
    const payload = {
      statusCode,
      message: Utils.getEnumKey(statusCode, HttpStatus)?.replace(
        /([a-z])([A-Z])/g,
        '$1 $2',
      ) ??
        'HTTP Error',
    };

    if (request.isAjaxRequest()) {
      return await this.createResponse(request, JSON.stringify(payload), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
        statusCode,
      });
    }

    if (
      this.customHttpHandlers.has(statusCode) ||
      this.customHttpHandlers.has(undefined)
    ) {
      const body = this.customHttpHandlers.get(
        this.customHttpHandlers.has(statusCode) ? statusCode : undefined,
      )?.(statusCode);

      return await this.createResponse(request, body, {
        statusCode,
      });
    }

    return await this.createResponse(
      request,
      await inject(TemplateCompiler).render(statusPage, payload, {
        request,
      }),
      {
        statusCode,
      },
    );
  }

  private async createResponse(
    request: HttpRequest,
    body: unknown,
    {
      cookies = {},
      headers = {},
      statusCode = HttpStatus.Ok,
    }: ResponseOptions = {},
  ): Promise<Response> {
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
          cors.allowedOrigins.includes(request.header('origin') ?? '') ||
        cors.allowedOrigins[0] === '*') && {
        'access-control-allow-origin': cors.allowedOrigins[0] === '*'
          ? '*'
          : request.header('origin'),
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
      ...(!cors.allowedMethods.includes('*') && {
        'vary': 'origin',
      }),
      'x-content-type-options': 'nosniff',
      'x-dns-prefetch-control': 'off',
      'x-xss-protection': '0',
    };

    const { body: parsedBody, contentType } = await this.parseResponseBody(
      request,
      body,
    );

    const baseHeaders = {
      'content-type': `${contentType}; charset=utf-8`,
      'cache-control': this.configurator.entries.cache.enabled &&
          await request.isStaticFileRequest()
        ? `max-age=${
          this.configurator.entries.cache.maxAge * 24 * TimeUnit.Hour / 1000
        }`
        : 'no-cache',
    };

    const response = new Response(parsedBody, {
      status: parsedBody === null ? HttpStatus.NoContent : statusCode,
      headers: {
        ...baseHeaders,
        ...securityHeaders,
        ...headers,
      },
    });

    if (!('session_id' in request.cookies)) {
      response.headers.append(
        'set-cookie',
        `session_id=${
          this.encrypter.generateUuid({ clean: true })
        }; SameSite=Lax; Max-Age=${
          this.configurator.entries.session.lifetime * 24 * TimeUnit.Hour / 1000
        }`,
      );
    }

    for (const [cookie, cookieValue] of Object.entries(cookies)) {
      response.headers.append(
        'set-cookie',
        `${cookie}=${cookieValue}; SameSite=Lax; Max-Age=${
          this.configurator.entries.cookies.maxAge * 24 * TimeUnit.Hour / 1000
        }`,
      );
    }

    if (
      !request.isAjaxRequest() && !await request.isFormRequest() &&
      !await request.isStaticFileRequest()
    ) {
      await request.session.set('@entropy/previous_location', request.path());
    }

    return response;
  }

  private async createSeoRobotsFile(request: HttpRequest): Promise<Response> {
    const directives: [string, string][] = [
      ['Allow', '*'],
      ['User-agent', '*'],
    ];

    if (this.configurator.entries.seo.sitemap) {
      directives.push(['Sitemap', `${request.origin}/sitemap.xml`]);
    }

    return await this.createResponse(
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

  private async createSeoSitemapFile(request: HttpRequest): Promise<Response> {
    const directUrlInvalidChars = [
      '\\',
      '?',
      ':',
      '*',
      '+',
      '^',
      '$',
      '|',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
    ];

    const urls = [
      ...this.routeStore.routes.map(({ path }) => path),
      ...this.configurator.entries.seo.sitemapUrls,
    ].filter((path) => {
      return directUrlInvalidChars.every((char) =>
        !path.includes(char) || path.includes(`\\${char}`)
      ) && !this.configurator.entries.seo.sitemapExcludeUrls.includes(path);
    });

    const indent = '  ';

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) =>
        `${indent}<url><loc>${request.origin}${url}</loc><lastmod>${
          new Date().toISOString().split('T')[0]
        }</lastmod></url>`
      ),
      '</urlset>\n',
    ];

    return await this.createResponse(request, xml.join('\n'), {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
      },
    });
  }

  private async createStaticFileResponse(
    request: HttpRequest,
  ): Promise<Response> {
    const filePath = `public${request.path()}`;

    try {
      const fileSize = (await Deno.stat(filePath)).size;
      const body = await Deno.readFile(filePath);

      return await this.createResponse(request, body, {
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

  private async parseResponseBody(
    request: HttpRequest,
    body: unknown,
  ): Promise<{ body: string | null | ReadableStream; contentType: string }> {
    let contentType = 'text/html';

    if (body instanceof Promise) {
      body = await body;
    }

    switch (true) {
      case ['bigint', 'boolean', 'number', 'string', 'symbol']
        .includes(
          typeof body,
        ): {
        body = String(body);

        break;
      }

      case typeof body === 'undefined': {
        body = null;

        break;
      }

      case body instanceof View: {
        const template = await (body as View).getTemplate();
        const compiledTemplate = await inject(TemplateCompiler).render(
          template,
          (body as View).variables,
          {
            file: (body as View).file,
            request,
            ...(body as View).options,
          },
        );

        body = compiledTemplate;

        break;
      }

      case body instanceof Json: {
        body = JSON.stringify((body as Json).json);
        contentType = 'application/json';

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
        if (body instanceof ReadableStream || body instanceof Uint8Array) {
          contentType = 'application/octet-stream';

          break;
        }

        throw new Error('Invalid response type');
      }
    }

    return {
      body: body as string | null | ReadableStream,
      contentType,
    };
  }

  private resolveRoutePath(basePath: RoutePath, path: RoutePath): RoutePath {
    return basePath === '/'
      ? path
      : `${basePath}${
        path[0] !== '/' && basePath.split('').pop() !== '/' ? '/' : ''
      }${path}` as RoutePath;
  }

  public createRouteDecorator<
    THttpMethods extends EnumValuesUnion<HttpMethod>[] | undefined = undefined,
  >(httpMethods?: THttpMethods): RouteDecoratorFunction<THttpMethods> {
    const decoratorCallback = (
      path: RoutePath,
      methods: EnumValuesUnion<HttpMethod>[],
      options: RouteOptions = {},
    ): MethodDecorator => {
      return (originalMethod, context) => {
        if (context.private) {
          throw new Error(
            `Controller route method ${context
              .name as string} has to be public`,
          );
        }

        if (context.static) {
          throw new Error(
            `Controller route method ${context
              .name as string} cannot be static`,
          );
        }

        Reflector.defineMetadata<Partial<Route>>(
          'route',
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
          methods: EnumValuesUnion<HttpMethod>[],
          path: RoutePath,
          options: RouteOptions = {},
        ) => {
          return decoratorCallback(path, methods, options);
        }
    ) as RouteDecoratorFunction<THttpMethods>;
  }

  public registerController(controller: Constructor<Controller>): void {
    const controllerInstance = inject(controller);

    const controllerProperties = Object.getOwnPropertyNames(
      Object.getPrototypeOf(controllerInstance),
    );

    const controllerRouteMethods = controllerProperties.filter((property) => {
      return (
        property !== 'constructor' &&
        property[0] !== '_' &&
        typeof Object.getPrototypeOf(controllerInstance)[property] ===
          'function'
      );
    });

    for (const controllerRouteMethod of controllerRouteMethods) {
      const controllerMethod = Object.getPrototypeOf(
        controllerInstance,
      )[controllerRouteMethod] as (
        ...args: unknown[]
      ) => unknown;

      const taskInterval = Reflector.getMetadata<number>(
        'interval',
        controllerMethod,
      );

      if (taskInterval) {
        this.scheduler.interval(taskInterval, async () => {
          const methodResult = controllerMethod.call(controllerInstance);

          if (methodResult instanceof Promise) {
            await methodResult;
          }
        });

        continue;
      }

      const taskSchedule = Reflector.getMetadata<
        [string, string | Deno.CronSchedule]
      >(
        'schedule',
        controllerMethod,
      );

      if (taskSchedule) {
        this.scheduler.schedule(...taskSchedule, async () => {
          const methodResult = controllerMethod.call(controllerInstance);

          if (methodResult instanceof Promise) {
            await methodResult;
          }
        });

        continue;
      }

      const taskTimeout = Reflector.getMetadata<number>(
        'timeout',
        controllerMethod,
      );

      if (taskTimeout) {
        this.scheduler.timeout(taskTimeout, async () => {
          const methodResult = controllerMethod.call(controllerInstance);

          if (methodResult instanceof Promise) {
            await methodResult;
          }
        });

        continue;
      }

      const handler = Reflector.getMetadata<{ statusCode?: HttpStatus }>(
        'httpErrorHandler',
        controllerMethod,
      );

      if (handler) {
        this.customHttpHandlers.set(
          handler.statusCode,
          async (statusCode: HttpStatus) => {
            const methodResult = controllerMethod.call(
              controllerInstance,
              statusCode,
            );

            return methodResult instanceof Promise
              ? await methodResult
              : methodResult;
          },
        );

        continue;
      }

      const {
        assert,
        cookies,
        headers,
        methods,
        middleware,
        name,
        path,
        pipes,
        redirectTo,
        statusCode,
        view,
      } = Reflector.getMetadata<
        Exclude<Route, 'action'>
      >('route', controllerMethod)!;

      const basePath = Reflector.getMetadata<RoutePath>(
        'basePath',
        Object.getPrototypeOf(controllerInstance),
      ) ??
        '/';

      const resolvedPath = this.resolveRoutePath(basePath, path);

      this.registerRoute(resolvedPath, methods, async (...args: unknown[]) => {
        const methodResult = controllerMethod.call(controllerInstance, ...args);

        return methodResult instanceof Promise
          ? await methodResult
          : methodResult;
      }, {
        assert: Reflector.getMetadata<
          Record<string, Partial<ValidatorRulesList> | Record<string, unknown>>
        >(
          'assert',
          controllerMethod,
        ) ?? assert,
        cookies: Reflector.getMetadata<Record<string, string>>(
          'cookies',
          controllerMethod,
        ) ?? cookies,
        headers: Reflector.getMetadata<Record<string, string>>(
          'headers',
          controllerMethod,
        ) ?? headers,
        middleware: Reflector.getMetadata<Constructor<Middleware>[]>(
          'middleware',
          controllerMethod,
        ) ?? middleware,
        name: Reflector.getMetadata<string>(
          'name',
          controllerMethod,
        ) ?? name,
        pipes: Reflector.getMetadata<
          Record<string, Constructor<Pipe>>
        >('pipes', controllerMethod) ?? pipes,
        redirectTo: Reflector.getMetadata<RedirectDestination>(
          'redirectDestination',
          controllerMethod,
        ) ?? redirectTo,
        statusCode: Reflector.getMetadata<HttpStatus>(
          'statusCode',
          controllerMethod,
        ) ?? statusCode,
        view: Reflector.getMetadata<string>(
          'view',
          controllerMethod,
        ) ?? view,
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
      await request.session.setup();

      if (!this.configurator.getEnv<boolean>('TESTING')) {
        if (!await request.isStaticFileRequest()) {
          await request.session.increment(['_entropy', 'request_id'], 1, 0);
        }

        if (this.configurator.entries.csrfProtection) {
          if (!await request.session.has(['_entropy', 'csrf_token'])) {
            await request.session.set(
              ['_entropy', 'csrf_token'],
              this.encrypter.generateUuid({ clean: true }),
            );
          }

          if (await request.isFormRequest()) {
            const csrfToken = await request.session.get<string>(
              ['_entropy', 'csrf_token'],
            );

            if (
              !csrfToken ||
              ![
                await request.input('_token'),
                request.header('x-csrf-token'),
                request.header('x-token'),
                request.header('x-xsrf-token'),
              ].includes(csrfToken)
            ) {
              throw new HttpError(HttpStatus.InvalidToken);
            }
          }
        }
      }

      const requestMethod = await request.method();

      for (
        const {
          action,
          assert,
          cookies,
          headers,
          methods,
          middleware,
          path,
          pipes,
          redirectTo,
          statusCode,
          view,
        } of this.routeStore.routes
      ) {
        if (!methods.includes(requestMethod)) {
          continue;
        }

        for (const middlewareHandler of middleware ?? []) {
          const result = inject(middlewareHandler).handle(request);

          result instanceof Promise ? await result : result;
        }

        const urlPattern = new URLPattern({
          pathname: path,
        });

        for (const method of methods) {
          if (requestMethod === method && urlPattern.test(request.url())) {
            if (redirectTo) {
              return await request.createRedirect(redirectTo);
            }

            if (view) {
              const viewInstance = new View(
                view.endsWith('.atom.html') ? view : `${view}.atom.html`,
              );

              await viewInstance.assertExists();

              return await this.createResponse(request, viewInstance);
            }

            if (assert) {
              const errors = await this.validator.validate(
                request,
                assert,
              );

              if (Object.keys(errors).length) {
                if (request.isAjaxRequest()) {
                  return await this.createResponse(
                    request,
                    JSON.stringify({
                      errors,
                    }),
                    {
                      headers: {
                        'content-type': 'application/json; charset=utf-8',
                      },
                      statusCode: HttpStatus.BadRequest,
                    },
                  );
                }

                return await request.createRedirectBack({
                  $errors: errors,
                  $input: Object.fromEntries(await request.form()),
                });
              }
            }

            const paramGroups =
              urlPattern.exec(request.url())?.pathname.groups ??
                {};

            for (const [paramName, paramValue] of Object.entries(paramGroups)) {
              if (paramValue === '') {
                paramGroups[paramName] = undefined;
              }
            }

            if (pipes) {
              for (const [paramName, pipe] of Object.entries(pipes)) {
                if (!(paramName in paramGroups) || !paramGroups[paramName]) {
                  continue;
                }

                const transformed = inject(pipe).transform(
                  paramGroups[paramName] ?? '',
                );

                paramGroups[paramName] = transformed instanceof Promise
                  ? await transformed
                  : transformed;
              }
            }

            const resolvedParams = Object.values(paramGroups);

            return await this.createResponse(
              request,
              await action(
                resolvedParams,
                request,
              ),
              {
                cookies,
                headers,
                statusCode,
              },
            );
          }
        }
      }

      if (
        requestMethod === HttpMethod.Get &&
        request.path().includes('.')
      ) {
        if (
          request.path() === '/robots.txt' &&
          this.configurator.entries.seo.robots
        ) {
          return await this.createSeoRobotsFile(request);
        }

        if (
          request.path() === '/sitemap.xml' &&
          this.configurator.entries.seo.sitemap
        ) {
          return await this.createSeoSitemapFile(request);
        }

        return await this.createStaticFileResponse(request);
      }

      throw new HttpError(HttpStatus.NotFound);
    } catch (error) {
      const { file, line } = this.errorHandler.handle(error as Error);

      if (
        this.configurator.entries.isProduction || error instanceof HttpError
      ) {
        return await this.createAbortResponse(
          request,
          error instanceof HttpError
            ? error.statusCode
            : HttpStatus.InternalServerError,
        );
      }

      const stackTrace = (error as Error).stack?.split('\n').map((line) =>
        line.trim().replace('at ', '')
      ).filter((line) => !line.startsWith('file')).slice(1, 3);

      let fileContent: string | undefined;

      try {
        fileContent = await Deno.readTextFile(file ?? '');
      } catch {
        fileContent = undefined;
      }

      return await this.createResponse(
        request,
        await inject(TemplateCompiler).render(
          errorPage,
          {
            codeSnippet: fileContent?.split('\n').map((content, index) => ({
              content,
              line: index + 1,
            })).slice(
              line ? line - 2 : 0,
              line ? line + 2 : undefined,
            ),
            error,
            errorLine: line,
            stackTrace,
            fullStackTrace: (error as Error).stack,
          },
          {
            request,
          },
        ),
        {
          statusCode: HttpStatus.InternalServerError,
        },
      );
    }
  }

  public baseUrl(): Url {
    return `${
      this.configurator.entries.tls.enabled ? 'https' : 'http'
    }://${this.configurator.entries.host}${
      this.configurator.entries.isProduction
        ? ''
        : `:${this.configurator.entries.port}`
    }`;
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

  public except(
    methods: EnumValuesUnion<HttpMethod>[],
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(
      path,
      Object.values(HttpMethod).filter((httpMethod) =>
        !methods.includes(httpMethod)
      ),
      action,
      options,
    );
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

  public methods(
    methods: EnumValuesUnion<HttpMethod>[],
    path: RoutePath,
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.registerRoute(path, methods, action, options);
  }

  public registerRoute(
    path: RoutePath,
    methods: EnumValuesUnion<HttpMethod>[],
    action: (...args: unknown[]) => Promise<unknown>,
    options: RouteOptions = {},
  ): void {
    this.routeStore.routes.push({
      action,
      methods,
      path,
      ...options,
    });
  }
}
