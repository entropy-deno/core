import { load } from '@std/dotenv/mod.ts';
import { serve } from '@std/http/mod.ts';

export class Server {
  public async start(): Promise<void> {
    await load({
      envPath: `${Deno.cwd()}/.env`,
      export: true,
      allowEmptyValues: true,
    });

    await serve((request: Request) => {
      const timerStart = performance.now();

      const timerEnd = performance.now();

      console.log(`%cRequest: ${new URL(request.url).pathname} %c[${(timerEnd - timerStart).toFixed(3)}ms]`, 'color: green; font-weight: bold;', 'color: gray;');

      return new Response('Hello World!', {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }, {
      port: Number(Deno.env.get('PORT')),
    });
  }
}
