import { load as loadEnv } from '@std/dotenv/mod.ts';
import { serve } from '@std/http/mod.ts';
import { env } from '../utils/functions/env.function.ts';
import { existsSync } from '@std/fs/mod.ts';
import { dirname } from '@std/path/mod.ts';
import { contentType } from '@std/media_types/mod.ts';
import { parse as parseFlags } from '@std/flags/mod.ts';
import { WebClientAlias } from './enums/web_client_alias.enum.ts';

export class Server {
  private checkSystemRequirements(): void {
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
  }

  private async serve(request: Request): Promise<Response> {
    const timerStart = performance.now();

    let response = new Response('Hello World!', {
      headers: {
        'content-type': 'text/html; charset=utf-8',
      },
    });

    if (request.method === 'GET' && new URL(request.url).pathname.includes('.')) {
      const filePath = `${Deno.cwd()}/public${new URL(request.url).pathname}`;

      let fileSize;

      try {
        fileSize = (await Deno.stat(filePath)).size;

        const body = (await Deno.open(filePath)).readable;

        response = new Response(body, {
          headers: {
            'content-length': fileSize.toString(),
            'content-type': contentType(filePath.split('.')?.pop() ?? '') ?? 'application/octet-stream',
          },
        });
      } catch {
        response = new Response(null, {
          status: 404,
        });
      }
    }

    const timerEnd = performance.now();

    console.log(
      `%c[%c${response.status}%c] %cRequest: ${new URL(request.url).pathname} %c[${
        (timerEnd - timerStart).toFixed(3)
      }ms]`,
      'color: gray;',
      'color: blue;',
      'color: gray;',
      'color: green; font-weight: bold;',
      'color: gray;',
    );

    return response;
  }

  private async setupDevelopmentEnvironment(): Promise<void> {
    const port = env('PORT') ?? 5050;
    const tempFilePath = '.temp/server';

    const flags = parseFlags(Deno.args, {
      boolean: ['open'],
      default: {
        open: false,
      },
    });

    Deno.addSignalListener('SIGINT', async () => {
      if (existsSync(dirname(tempFilePath))) {
        await Deno.remove(dirname(tempFilePath), {
          recursive: true,
        });
      }

      Deno.exit();
    });

    if (flags.open && !existsSync(tempFilePath)) {
      if (!existsSync(dirname(tempFilePath))) {
        await Deno.mkdir(dirname(tempFilePath));
      }

      await Deno.writeTextFile(
        tempFilePath,
        'Flavor development server is running...',
      );

      const openWebClientCommand = new Deno.Command(
        `${
          WebClientAlias[Deno.build.os as 'darwin' | 'linux' | 'win32'] ??
            'open'
        }`,
        {
          args: [`http://localhost:${port}`],
          stdin: 'null',
          stdout: 'null',
          stderr: 'null',
        },
      );

      openWebClientCommand.spawn();
    }
  }

  public async start(port = env<number>('PORT', 5050)): Promise<void> {
    this.checkSystemRequirements();

    await loadEnv({
      allowEmptyValues: true,
      envPath: `${Deno.cwd()}/.env`,
      export: true,
    });

    if (env<boolean>('DEVELOPMENT')) {
      await this.setupDevelopmentEnvironment();
    }

    await serve(this.serve, {
      port,
      onListen: () => {
        console.log(
          `%cHTTP server is running on ${
            env<boolean>('DEVELOPMENT') ? 'http://localhost:' : 'port '
          }${port} %c[${Deno.build.os === 'darwin' ? '⌃C' : 'ctrl+c'} to quit]`,
          'color: green; font-weight: bold;',
          'color: gray;',
        );
      },
    });
  }
}
