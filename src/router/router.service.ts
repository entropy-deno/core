import { contentType } from '@std/media_types/mod.ts';
import { renderToString } from 'https://jspm.dev/react-dom@18.0.0/server';
import { createElement } from 'https://jspm.dev/react@18.0.0';
import { StatusPage } from '../http/pages/status_page.tsx';
import { StatusCode } from '../http/enums/status_code.enum.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { RoutePath } from './types/route_path.type.ts';

export class Router {
  private readonly routes = new Map<RegExp, () => unknown>();

  private abortResponse(status = StatusCode.NotFound): Response {
    return new Response(
      renderToString(
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

  private async handleFileRequest(request: Request): Promise<Response> {
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
      if (validatedParams.includes(param[1])) {
        throw new Error(`Duplicate route parameter name: ${param[1]}`);
      }

      validatedParams.push(param[1]);
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
    let response = this.abortResponse(StatusCode.NotFound);

    for (const [pathRegexp, callback] of this.routes) {
      if (pathRegexp.test(new URL(request.url).pathname)) {
        response = new Response(callback() as string, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
          },
        });

        if (
          request.method === HttpMethod.Get &&
          new URL(request.url).pathname.includes('.')
        ) {
          return await this.handleFileRequest(request);
        }

        break;
      }
    }

    return response;
  }

  public route(
    path: RoutePath,
    method: HttpMethod | `${HttpMethod}`,
    callback: () => unknown,
  ): void {
    const pathRegexp = this.resolvePathRegexp(path);

    if (this.routes.has(pathRegexp)) {
      throw new Error(`Duplicate route path: ${path}`);
    }

    this.routes.set(pathRegexp, callback);
  }
}
