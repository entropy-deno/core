import { contentType } from '@std/media_types/mod.ts';
import { renderToString } from 'https://jspm.dev/react-dom@18.0.0/server';
import { createElement } from 'https://jspm.dev/react@18.0.0';
import { StatusPage } from '../http/pages/status_page.tsx';
import { StatusCode } from '../http/enums/status_code.enum.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';

export class Router {
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
      const status = StatusCode.NotFound;

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
              'Internal Server Error',
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
  }

  public async respond(request: Request): Promise<Response> {
    const response = new Response('Hello World!', {
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });

    if (
      request.method === HttpMethod.Get && new URL(request.url).pathname.includes('.')
    ) {
      return await this.handleFileRequest(request);
    }

    return response;
  }
}
