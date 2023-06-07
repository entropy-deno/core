import { contentType } from '@std/media_types/mod.ts';
import { createElement } from 'https://jspm.dev/react@18.0.0';
import { renderToString as renderJsx } from 'https://jspm.dev/react-dom@18.0.0/server';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { RouteDefinition } from './interfaces/route_definition.interface.ts';
import { RoutePath } from './types/route_path.type.ts';
import { StatusCode } from '../http/enums/status_code.enum.ts';
import { StatusPage } from '../http/pages/status_page.tsx';

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

  public async respond(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);

    let response = this.abortResponse(StatusCode.NotFound);

    for (const [pathRegexp, { action, method }] of this.routes) {
      if (request.method === method && pathRegexp.test(pathname)) {
        const resolvedParams = Object.values(
          pathRegexp.exec(pathname)?.groups ?? {},
        );

        const body = action(request, resolvedParams);

        response = new Response(body as string, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        });

        if (
          request.method === HttpMethod.Get &&
          pathname.includes('.')
        ) {
          return await this.handleStaticFileRequest(request);
        }

        break;
      }
    }

    return response;
  }

  public route(
    path: RoutePath,
    method: HttpMethod | `${HttpMethod}`,
    action: (...args: unknown[]) => unknown,
  ): void {
    const pathRegexp = this.resolvePathRegexp(path);

    if (this.routes.has(pathRegexp)) {
      throw new Error(`Duplicate route path: ${path}`);
    }

    this.routes.set(pathRegexp, {
      action,
      method,
      path,
    });
  }
}
