import { env } from '../../utils/functions/env.function.ts';
import { StatusCode } from '../enums/status_code.enum.ts';

export function createResponse(
  body: ReadableStream | XMLHttpRequestBodyInit | null,
  { headers = {}, status = StatusCode.Ok }: {
    headers?: HeadersInit;
    status?: StatusCode;
  },
): Response {
  const developmentCspDirectives = env<boolean>('DEVELOPMENT')
    ? ' http://localhost:* ws://localhost:*'
    : '';

  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy':
        `default-src 'self' 'unsafe-inline'${developmentCspDirectives};base-uri 'self';connect-src 'self'${developmentCspDirectives};font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src *;object-src 'none';script-src 'self' 'unsafe-inline'${developmentCspDirectives};script-src-attr 'unsafe-inline';style-src 'self' 'unsafe-inline' https://fonts.googleapis.com${developmentCspDirectives};upgrade-insecure-requests`,
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
