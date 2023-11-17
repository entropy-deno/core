import { assertEquals } from 'https://deno.land/std@0.207.0/assert/mod.ts';
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

    assertEquals(httpRequest.cache, 'default');
    assertEquals(httpRequest.credentials, 'same-origin');
    assertEquals(httpRequest.cookie('test'), undefined);
    assertEquals(httpRequest.header('test'), 'test');
    assertEquals(await httpRequest.files(), {});
    assertEquals(await httpRequest.method(), HttpMethod.Get);
  });
});
