import { expect } from 'https://deno.land/std@0.221.0/expect/expect.ts';
import { HttpMethod } from './enums/http_method.enum.ts';
import { HttpRequest } from './http_request.class.ts';

Deno.test('http module', async (test) => {
  await test.step('http request object exposes its properties properly', async () => {
    const request = new Request('https://entropy.deno.dev', {
      method: HttpMethod.Get,
      headers: {
        'test': 'test',
      },
    });

    const httpRequest = new HttpRequest(request);

    expect(httpRequest.cache()).toBe('default');
    expect(httpRequest.credentials()).toBe('same-origin');
    expect(httpRequest.cookie('test')).toBeUndefined();
    expect(httpRequest.header('test')).toBe('test');
    expect(await httpRequest.files()).toEqual({});
    expect(await httpRequest.method()).toBe(HttpMethod.Get);
  });
});
