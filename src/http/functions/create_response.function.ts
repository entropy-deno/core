import { Configurator } from '../../configurator/configurator.service.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { HttpStatus } from '../enums/http_status.enum.ts';

interface Options {
  headers?: HeadersInit;
  statusCode?: HttpStatus;
}

const configurator = inject(Configurator);

export function createResponse(
  body: ReadableStream | XMLHttpRequestBodyInit | null,
  { headers = {}, statusCode = HttpStatus.Ok }: Options = {},
): Response {
  const cspDirectives = configurator.entries.isProduction
    ? ''
    : ` http://${configurator.entries.host}:* ws://${configurator.entries.host}:*`;

  return new Response(body, {
    status: statusCode,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        `default-src 'self' 'unsafe-inline'${cspDirectives};base-uri 'self';connect-src 'self'${cspDirectives};font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src *;object-src 'none';script-src 'self' 'unsafe-inline'${cspDirectives};script-src-attr 'unsafe-inline';style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${cspDirectives};upgrade-insecure-requests`,
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
      ...headers,
    },
  });
}
