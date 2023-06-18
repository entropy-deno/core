import { load as loadEnv } from '@std/dotenv/mod.ts';
import { parse as parseFlags } from '@std/flags/mod.ts';
import { AppConfig } from './interfaces/app_config.interface.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { env } from '../utils/functions/env.function.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Module } from './interfaces/module.interface.ts';
import { Router } from '../router/router.service.ts';
import { runCommand } from '../utils/functions/run_command.function.ts';
import { ServerOptions } from './interfaces/server_options.interface.ts';
import { WebClientAlias } from './enums/web_client_alias.enum.ts';

export class Server {
  private readonly config: AppConfig = {};

  private readonly devServerCheckKey = 'entropy:devServer';

  private readonly errorHandler = inject(ErrorHandler);

  private httpHost = 'localhost';

  private httpPort = 5050;

  private readonly listenSignals: Deno.Signal[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  private readonly modules: Constructor<Module>[] = [];

  private readonly router = inject(Router);

  constructor(options: ServerOptions) {
    this.config = options.config ?? {};
    this.modules = options.modules;
  }

  private checkSystemRequirements(): void {
    const minimumDenoVersion = '1.34.0';

    const satisfiesDenoVersion = Deno.version.deno
      .localeCompare(minimumDenoVersion, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

    if (satisfiesDenoVersion === -1) {
      console.warn(
        `\n%cEntropy requires Deno version ${minimumDenoVersion} or higher %c[run 'deno upgrade' to update Deno]`,
        `color: orange`,
        'color: gray',
      );

      Deno.exit(1);
    }
  }

  private async serveHttp(connection: Deno.Conn): Promise<void> {
    try {
      const httpConnection = Deno.serveHttp(connection);

      for await (const { request, respondWith } of httpConnection) {
        const timerStart = performance.now();

        if (request.headers.get('upgrade')?.toLowerCase() === 'websocket') {
          const { socket, response } = Deno.upgradeWebSocket(request);

          socket.onopen = () => {
            console.log('WebSocket connection established');
          };

          respondWith(response);
        }

        const response = await this.router.respond(request);

        const { status } = response;
        const { pathname } = new URL(request.url);

        let statusColor = 'blue';

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
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
        });

        const responseTime = (performance.now() - timerStart).toFixed(2);

        console.log(
          `\n%c[${timestamp}] %c[%c${status}%c] %cRequest: %c${pathname} %c${
            '.'.repeat(columns - pathname.length - responseTime.length - 40)
          } [${responseTime}ms]`,
          'color: gray',
          'color: lightgray',
          `color: ${statusColor}`,
          'color: lightgray',
          'color: blue',
          'color: white; font-weight: bold',
          'color: gray',
        );

        respondWith(response);
      }
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }

  private setup(): void {
    for (const module of this.modules) {
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
            WebClientAlias[Deno.build.os as 'darwin' | 'linux' | 'win32'] ??
              'open'
          }`,
          [`http://${this.httpHost}:${this.httpPort}`],
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

    if (env<boolean>('DEVELOPMENT')) {
      console.warn(
        `\n%cYou are running production server in development mode %c[set 'DEVELOPMENT' .env variable to 'false' to disable dev mode]`,
        'color: orange',
        'color: gray',
      );
    }
  }

  public async start(
    port?: number,
    host?: string,
  ): Promise<void> {
    this.checkSystemRequirements();

    await loadEnv({
      allowEmptyValues: true,
      envPath: this.config.envFile ?? '.env',
      export: true,
    });

    this.httpHost = host ?? env<string>('HOST') ?? this.httpHost;
    this.httpPort = port ?? env<number>('PORT') ?? this.httpPort;

    const flags = parseFlags(Deno.args, {
      boolean: ['dev'],
      default: {
        dev: false,
      },
    });

    flags.dev
      ? this.setupDevelopmentEnvironment()
      : this.setupProductionEnvironment();

    try {
      this.setup();

      const listener = Deno.listen({
        hostname: this.httpHost,
        port: this.httpPort,
      });

      console.log(
        `\n%cHTTP server is running on ${
          env<boolean>('DEVELOPMENT')
            ? `http://${this.httpHost}:${this.httpPort}`
            : `port ${this.httpPort}`
        } %c[${Deno.build.os === 'darwin' ? '⌃C' : 'Ctrl+C'} to quit]`,
        'color: mediumblue',
        'color: gray',
      );

      for await (const connection of listener) {
        this.serveHttp(connection);
      }
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }
}
