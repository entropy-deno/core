import {
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.201.0/assert/mod.ts';
import { fetchRoute } from './functions/fetch_route.function.ts';
import { Controller } from '../http/controller.class.ts';
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

    assertStringIncludes(body, 'Hello, world!');
    assertEquals(statusCode, HttpStatus.Ok);
  });
});
