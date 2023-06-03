import { load } from '@std/dotenv/mod.ts';
import { serve } from '@std/http/mod.ts';

export class Server {
  public async start(): Promise<void> {
    await load({
      allowEmptyValues: true,
      envPath: `${Deno.cwd()}/.env`,
      export: true,
    });

    const minimumDenoVersion = '1.34.0';

    const satisfiesDenoVersion = Deno.version.deno
      .localeCompare(minimumDenoVersion, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

    if (satisfiesDenoVersion === -1) {
      console.warn(
        `%cFlavor requires Deno version ${minimumDenoVersion} or higher %c[run 'deno upgrade' to update Deno]`,
        `color: orange; font-weight: bold;`,
        'color: gray;',
      );

      Deno.exit(1);
    }

    await serve((request: Request) => {
      const timerStart = performance.now();

      const timerEnd = performance.now();

      console.log(
        `%cRequest: ${new URL(request.url).pathname} %c[${
          (timerEnd - timerStart).toFixed(3)
        }ms]`,
        'color: green; font-weight: bold;',
        'color: gray;',
      );

      return new Response('Hello World!', {
        headers: {
          'content-type': 'text/html; charset=utf-8',
        },
      });
    }, {
      port: Number(Deno.env.get('PORT')),
      onListen: () => {
        console.log(
          `%cServer listening on http://localhost:${Deno.env.get('PORT')} %c[${
            Deno.build.os === 'darwin' ? '⌃C' : 'ctrl+c'
          } to quit]`,
          'color: green; font-weight: bold;',
          'color: gray;',
        );
      },
    });
  }
}
