import { expect } from 'https://deno.land/std@0.215.0/expect/expect.ts';
import { fetchRoute } from './functions/fetch_route.function.ts';
import { Controller } from '../router/controller.class.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { Route } from '../router/router.module.ts';

class RootController extends Controller {
  @Route.Get('/')
  public index() {
    return 'Hello, world!';
  }
}

Deno.test('testing module', async (test) => {
  await test.step('implements properly the fetchRoute() function', async () => {
    const { body, statusCode } = await fetchRoute('/', RootController);

    expect(body).toContain('Hello, world!');
    expect(statusCode).toBe(HttpStatus.Ok);
  });
});
