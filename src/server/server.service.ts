import { load as loadEnv } from '@std/dotenv/mod.ts';
import { parse as parseFlags } from '@std/flags/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { env } from '../utils/functions/env.function.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.module.ts';
import { Logger } from '../logger/logger.service.ts';
import { Router } from '../router/router.service.ts';
import { runCommand } from '../utils/functions/run_command.function.ts';
import { ServerOptions } from './interfaces/server_options.interface.ts';
import { WebClientAlias } from './enums/web_client_alias.enum.ts';

export class Server {
  private readonly configurator = inject(Configurator);

  private readonly devServerCheckKey = 'entropy:devServer';

  private readonly errorHandler = inject(ErrorHandler);

  private readonly listenSignals: Deno.Signal[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  private readonly localizator = inject(Localizator);

  private readonly logger = inject(Logger);

  private readonly router = inject(Router);

  constructor(private readonly options: ServerOptions) {}

  private checkSystemRequirements(): void {
    const minimumDenoVersion = '1.34.0';

    const satisfiesDenoVersion = Deno.version.deno
      .localeCompare(minimumDenoVersion, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

    if (satisfiesDenoVersion === -1) {
      this.logger.warn(
        `Entropy requires Deno version ${minimumDenoVersion} or higher %c[run 'deno upgrade' to update Deno]`,
        {
          colors: ['gray'],
        },
      );

      Deno.exit(1);
    }
  }

  private async serveHttp(connection: Deno.Conn): Promise<void> {
    try {
      const httpConnection = Deno.serveHttp(connection);

      for await (const { request, respondWith } of httpConnection) {
        const timerStart = performance.now();
        const url = new URL(request.url).pathname;

        if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
          const { socket, response } = Deno.upgradeWebSocket(request);

          if (
            !this.configurator.entries.isProduction && url === '/$entropy/hot-reload'
          ) {
            const watcher = Deno.watchFs('src');

            socket.onopen = async () => {
              for await (const event of watcher) {
                if (event.kind === 'modify') {
                  socket.send(JSON.stringify({
                    path: event.paths[0],
                  }));
                }
              }
            };

            socket.onclose = () => {
              watcher.close();
            };
          }

          respondWith(response);

          continue;
        }

        const response = await this.router.respond(request);
        const { status } = response;

        let statusColor: 'blue' | 'green' | 'orange' | 'red' = 'blue';

        switch (true) {
          case status >= 100 && status < 200:
            statusColor = 'blue';

            break;

          case status >= 200 && status < 400:
            statusColor = 'green';

            break;

          case status >= 400 && status < 500:
            statusColor = 'orange';

            break;

          case status >= 500 && status < 600:
            statusColor = 'red';

            break;
        }

        const { columns } = Deno.consoleSize();

        const timestamp = new Date().toLocaleString('en-us', {
          timeZone: 'UTC',
        });

        const responseTime = (performance.now() - timerStart).toFixed(1);

        this.logger.log(
          `%c${timestamp} %c[${status}] %c${url.substring(0, 40)} %c${
            '.'.repeat(
              columns - url.substring(0, 40).length - responseTime.length - 42,
            )
          } ${responseTime}ms`,
          {
            badge: 'Request',
            colors: ['lightgray', statusColor, 'white', 'gray'],
          },
        );

        respondWith(response);
      }
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }

  private setup(): void {
    for (const controller of this.options.controllers ?? []) {
      this.router.registerController(controller);
    }

    for (const module of this.options.modules) {
      const moduleInstance = inject(module);

      for (const controller of moduleInstance.controllers ?? []) {
        this.router.registerController(controller);
      }
    }
  }

  private setupDevelopmentEnvironment(): void {
    const flags = parseFlags(Deno.args, {
      boolean: ['open'],
      default: {
        open: false,
      },
    });

    for (const signal of this.listenSignals) {
      Deno.addSignalListener(signal, () => {
        localStorage.removeItem(this.devServerCheckKey);

        Deno.exit();
      });
    }

    if (flags.open && !localStorage.getItem(this.devServerCheckKey)) {
      try {
        runCommand(
          `${
            WebClientAlias[
              Deno.build.os as 'darwin' | 'linux' | 'win32' | 'windows'
            ] ??
              'open'
          }`,
          [`http://${this.configurator.entries.host}:${this.configurator.entries.port}`],
        );
      } finally {
        localStorage.setItem(this.devServerCheckKey, 'on');
      }
    }
  }

  private setupProductionEnvironment(): void {
    for (const signal of this.listenSignals) {
      Deno.addSignalListener(signal, () => {
        const shouldQuit = confirm(
          'Are you sure you want to quit production server?',
        );

        if (shouldQuit) {
          Deno.exit();
        }
      });
    }
  }

  public async start(): Promise<void> {
    const flags = parseFlags(Deno.args, {
      boolean: ['dev'],
      default: {
        dev: false,
      },
    });

    if (!env<string>('DENO_DEPLOYMENT_ID')) {
      this.checkSystemRequirements();

      if (this.configurator.entries.envFile) {
        await loadEnv({
          allowEmptyValues: true,
          envPath: this.configurator.entries.envFile ?? '.env',
          export: true,
        });
      }
    }

    Deno.env.set('PRODUCTION', flags.dev ? 'false' : 'true');

    this.configurator.setup(this.options.config);

    await this.localizator.setup();

    if (!env<string>('DENO_DEPLOYMENT_ID')) {
      flags.dev
        ? this.setupDevelopmentEnvironment()
        : this.setupProductionEnvironment();
    }

    try {
      this.setup();

      const listener = Deno.listen({
        hostname: this.configurator.entries.host,
        port: this.configurator.entries.port,
      });

      if (!env<string>('DENO_DEPLOYMENT_ID')) {
        this.logger.info(
          `HTTP server is running on %c${
            this.configurator.entries.isProduction
              ? `port ${this.configurator.entries.port}`
              : `http://${this.configurator.entries.host}:${this.configurator.entries.port}`
          } %c[${Deno.build.os === 'darwin' ? '⌃C' : 'Ctrl+C'} to quit]`,
          {
            badge: 'Server',
            colors: ['blue', 'gray'],
          },
        );
      }

      for await (const connection of listener) {
        this.serveHttp(connection);
      }
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }
}
