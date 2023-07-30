import { Route } from '../src/router/router.module.ts';
import { Controller } from '../src/http/controller.class.ts';
import { createServer } from '../src/server/functions/create_server.function.ts';

class RootController extends Controller {
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
      RootController,
    ],
  });

  await server.start();
});
