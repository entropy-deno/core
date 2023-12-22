import { Controller } from '../src/router/controller.class.ts';
import { createServer } from '../src/server/functions/create_server.function.ts';
import { Route } from '../src/router/router.module.ts';

class TestController extends Controller {
  @Route.Get('/')
  public index() {
    return 'Hello, world!';
  }
}

Deno.bench('entropy app server', async () => {
  const server = createServer({
    config: {
      envFile: false,
    },
    controllers: [
      TestController,
    ],
  });

  await server.start();
});
