import { load as loadEnv } from '@std/dotenv/mod.ts';
import { serve } from '@std/http/mod.ts';
import { env } from '../utils/functions/env.function.ts';
import { existsSync } from '@std/fs/mod.ts';
import { dirname } from '@std/path/mod.ts';
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

  private serve(request: Request): Response {
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
  }

  private async setupDevelopmentEnvironment(): Promise<void> {
    const port = env('PORT') ?? 5050;
    const tempFilePath = '.temp/server';

    if (!existsSync(tempFilePath)) {
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

      Deno.addSignalListener('SIGINT', async () => {
        await Deno.remove(dirname(tempFilePath), {
          recursive: true,
        });

        Deno.exit();
      });
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
