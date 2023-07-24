import { load as loadDotEnv } from 'https://deno.land/std@0.195.0/dotenv/mod.ts';
import { parse as parseFlags } from 'https://deno.land/std@0.195.0/flags/mod.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { HotReloadChannel } from './hot_reload.channel.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.module.ts';
import { Logger } from '../logger/logger.service.ts';
import { MIN_DENO_VERSION } from '../constants.ts';
import { Router } from '../router/router.service.ts';
import { runShellCommand } from '../utils/functions/run_shell_command.function.ts';
import { ServerOptions } from './interfaces/server_options.interface.ts';
import { WebClientAlias } from './enums/web_client_alias.enum.ts';
import { WsServer } from '../ws/ws_server.service.ts';

export class Server {
  private readonly configurator = inject(Configurator);

  private readonly devServerCheckKey = '$entropy/dev-server';

  private readonly errorHandler = inject(ErrorHandler);

  private readonly listenSignals: Deno.Signal[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  private readonly localizator = inject(Localizator);

  private readonly logger = inject(Logger);

  private readonly router = inject(Router);

  private readonly wsServer = inject(WsServer);

  constructor(private readonly options: ServerOptions) {}

  private checkSystemRequirements(): void {
    const satisfiesDenoVersion = Deno.version.deno
      .localeCompare(MIN_DENO_VERSION, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

    if (satisfiesDenoVersion === -1) {
      this.logger.warn(
        `Entropy requires Deno version ${MIN_DENO_VERSION} or higher %c[run 'deno upgrade' to update Deno]`,
        {
          colors: ['gray'],
        },
      );

      Deno.exit(1);
    }
  }

  private async handleRequest(request: Request): Promise<Response> {
    const timerStart = performance.now();
    const url = new URL(request.url).pathname;
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

    const responseTime = (performance.now() - timerStart).toFixed(1);

    this.logger.log(
      `%c[${status}] %c${url.substring(0, 40)}%c - ${responseTime}ms`,
      {
        badge: 'Request',
        colors: [statusColor, 'lightgray', 'gray'],
      },
    );

    return response;
  }

  private setup(): void {
    for (const controller of this.options.controllers ?? []) {
      this.router.registerController(controller);
    }

    for (const module of this.options.modules) {
      const moduleInstance = inject(module);

      this.router.registerControllers(moduleInstance.controllers ?? []);
      this.wsServer.registerChannels(moduleInstance.channels ?? []);
    }
  }

  private setupDevelopmentEnvironment(): void {
    this.wsServer.registerChannel(HotReloadChannel);

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
        runShellCommand(
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

    if (!this.configurator.entries.isDenoDeploy) {
      this.checkSystemRequirements();

      if (this.configurator.entries.envFile) {
        await loadDotEnv({
          allowEmptyValues: true,
          envPath: (this.configurator.entries.envFile ?? '.env'),
          export: true,
        });
      }
    }

    Deno.env.set('PRODUCTION', flags.dev ? 'false' : 'true');

    this.configurator.setup(this.options.config);

    await this.localizator.setup();

    if (!this.configurator.entries.isDenoDeploy) {
      flags.dev
        ? this.setupDevelopmentEnvironment()
        : this.setupProductionEnvironment();
    }

    try {
      this.setup();

      const tlsCertificate = this.configurator.entries.tlsCertificate ??
        (this.configurator.entries.tlsCertificateFile
          ? await Deno.readTextFile(this.configurator.entries.tlsCertificateFile)
          : false);

      const tlsKey = this.configurator.entries.tlsKey ??
        (this.configurator.entries.tlsKeyFile
          ? await Deno.readTextFile(this.configurator.entries.tlsKeyFile)
          : false);

      Deno.serve({
        ...(tlsCertificate && tlsKey
          ? {
            cert: tlsCertificate,
            key: tlsKey,
          }
          : {}),
        hostname: this.configurator.entries.host,
        port: this.configurator.entries.port,
        onListen: () => {
          if (!this.configurator.entries.isDenoDeploy) {
            this.logger.info(
              `HTTP server is running on ${
                this.configurator.entries.isProduction
                  ? `port %c${this.configurator.entries.port}`
                  : `%chttp://${this.configurator.entries.host}:${this.configurator.entries.port}`
              } %c[${Deno.build.os === 'darwin' ? '⌃C' : 'Ctrl+C'} to quit]`,
              {
                badge: 'Server',
                colors: ['blue', 'gray'],
              },
            );
          }
        },
      }, async (request) => await this.handleRequest(request));

      this.wsServer.start();

      if (flags.dev) {
        let viewWatcher: Deno.FsWatcher;

        try {
          viewWatcher = Deno.watchFs(['src', 'views']);
        } catch {
          viewWatcher = Deno.watchFs('src');
        }

        for await (const event of viewWatcher) {
          if (event.kind === 'modify') {
            inject(HotReloadChannel).sendReloadRequest();
          }
        }

        for (const signal of this.listenSignals) {
          Deno.addSignalListener(signal, () => {
            viewWatcher.close();

            Deno.exit();
          });
        }
      }
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }
}
