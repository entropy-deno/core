import { getAvailablePort } from 'https://deno.land/std@0.215.0/net/mod.ts';
import { load as loadDotEnv } from 'https://deno.land/std@0.215.0/dotenv/mod.ts';
import { parseArgs } from 'https://deno.land/std@0.215.0/cli/parse_args.ts';
import { $ } from '../utils/functions/$.function.ts';
import { Broadcaster } from '../web_socket/broadcaster.class.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { DENO_VERSION, MIN_DENO_VERSION, OS, VERSION } from '../constants.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { ErrorHandler } from '../error_handler/error_handler.service.ts';
import { HotReloadChannel } from './channels/hot_reload.channel.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.module.ts';
import { Logger } from '../logger/logger.service.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { Module } from './interfaces/module.interface.ts';
import { Reflector } from '../utils/reflector.class.ts';
import { Router } from '../router/router.service.ts';
import { ServerOptions } from './interfaces/server_options.interface.ts';
import { TemplateCompiler } from '../templates/template_compiler.service.ts';
import { TimeUnit } from '../scheduler/enums/time_unit.enum.ts';
import { Validator } from '../validator/validator.service.ts';

enum WebClientAlias {
  darwin = 'open',
  linux = 'sensible-browser',
  windows = 'explorer',
}

export class Server implements Disposable {
  private readonly arguments = parseArgs(Deno.args, {
    boolean: ['dev', 'open'],
    default: {
      dev: false,
      open: false,
    },
  });

  private readonly configurator = inject(Configurator);

  private readonly devServerCheckKey = '@entropy/dev_server';

  private readonly encrypter = inject(Encrypter);

  private readonly errorHandler = inject(ErrorHandler);

  private readonly exitSignals: Deno.Signal[] = [
    'SIGINT',
    'SIGQUIT',
    'SIGTERM',
  ];

  private readonly localizator = inject(Localizator);

  private readonly logger = inject(Logger);

  private options: Partial<ServerOptions> = {};

  private readonly router = inject(Router);

  private readonly templateCompiler = inject(TemplateCompiler);

  private readonly validator = inject(Validator);

  private readonly webSocketChannels: Constructor<Broadcaster>[] = [];

  private addExitSignalListener(callback: () => void): void {
    for (const signal of this.exitSignals) {
      if (OS === 'windows' && signal !== 'SIGINT') {
        continue;
      }

      Deno.addSignalListener(signal, () => {
        callback();
      });
    }
  }

  private checkSystemRequirements(): void {
    const satisfiesDenoVersion = DENO_VERSION
      .localeCompare(MIN_DENO_VERSION, undefined, {
        numeric: true,
        sensitivity: 'base',
      });

    if (satisfiesDenoVersion === -1) {
      this.logger.warn([
        `Entropy requires Deno version ${MIN_DENO_VERSION} or higher`,
        `Run 'deno upgrade' to update Deno executable`,
      ]);

      Deno.exit(1);
    }

    if (
      (VERSION.includes('alpha') || VERSION.includes('beta')) &&
      !this.configurator.entries.isProduction
    ) {
      this.logger.warn('Using a pre-release version of Entropy');
    }
  }

  private async handleRequest(
    request: Request,
    info: Deno.ServeHandlerInfo,
  ): Promise<Response> {
    if (
      request.headers.get('connection')?.toLowerCase() === 'upgrade' &&
      request.headers.get('upgrade')?.toLowerCase() === 'websocket' &&
      this.configurator.entries.webSocket
    ) {
      return this.handleWebSocketConnection(request);
    }

    const performanceTimerStart = performance.now();

    if (
      this.configurator.entries.isProduction &&
      this.configurator.entries.host === 'localhost'
    ) {
      this.configurator.entries.host = new URL(request.url).hostname;
    }

    const richRequest = new HttpRequest(
      request,
      info,
    );

    const response = await this.router.respond(richRequest);

    if (
      !await richRequest.isStaticFileRequest() &&
      !this.configurator.getEnv<boolean>('TESTING')
    ) {
      await richRequest.session.save();
    }

    const { status } = response;

    let statusColor: 'blue' | 'green' | 'orange' | 'red' = 'blue';

    switch (true) {
      case status >= 100 && status < 200: {
        statusColor = 'blue';

        break;
      }

      case status >= 200 && status < 400: {
        statusColor = 'green';

        break;
      }

      case status >= 400 && status < 500: {
        statusColor = 'orange';

        break;
      }

      case status >= 500 && status < 600: {
        statusColor = 'red';

        break;
      }
    }

    if (
      await richRequest.isStaticFileRequest() &&
      !this.configurator.entries.logger.staticFileRequests
    ) {
      return response;
    }

    const passedTime = performance.now() - performanceTimerStart;

    const responsePerformance = passedTime >= TimeUnit.Second
      ? `~ ${(passedTime / TimeUnit.Second).toFixed(1)}s`
      : `~ ${passedTime.toFixed(1)}ms`;

    this.logger.info(
      `%c[${status}] %c${richRequest.path()}${richRequest.queryString()}`,
      {
        additionalInfo: `${
          responsePerformance.length < 7
            ? `${
              ' '.repeat(7 - responsePerformance.length)
            }${responsePerformance}`
            : responsePerformance
        }`,
        colors: [statusColor, ''],
      },
    );

    return response;
  }

  private handleWebSocketConnection(request: Request): Response {
    const { socket, response } = Deno.upgradeWebSocket(request);

    for (const channel of this.webSocketChannels) {
      const channelInstance = inject(channel);
      const socketId = this.encrypter.generateUuid();

      const channelProperties = Object.getOwnPropertyNames(
        Object.getPrototypeOf(channelInstance),
      );

      const channelListenerMethods = channelProperties.filter((property) => {
        return (
          !['constructor', 'broadcast'].includes(property) &&
          property[0] !== '_' &&
          typeof Object.getPrototypeOf(channelInstance)[property] ===
            'function' &&
          !!Reflector.getMetadata<string>(
            'subscribeToEvent',
            Object.getPrototypeOf(channelInstance)[property],
          )
        );
      });

      const authorizationMethod = Object.getPrototypeOf(channelInstance)
        .authorize as () =>
          | boolean
          | Promise<boolean>;

      socket.onopen = () => {
        channelInstance.activeSockets.set(socketId, socket);
      };

      socket.onmessage = async ({ data }) => {
        for (const channelListenerMethod of channelListenerMethods) {
          if ('authorize' in channelInstance) {
            const isAuthorized = authorizationMethod.call(channelInstance);

            if (
              isAuthorized instanceof Promise
                ? !await isAuthorized
                : !isAuthorized
            ) {
              continue;
            }
          }

          const channelMethod = Object.getPrototypeOf(
            channelInstance,
          )[channelListenerMethod] as (
            payload: string,
          ) => unknown;

          const channelName = Reflector.getMetadata<string>(
            'name',
            Object.getPrototypeOf(channelInstance),
          );

          if (JSON.parse(data).channel === channelName) {
            channelMethod.call(channelInstance, JSON.parse(data).payload);
          }
        }
      };

      socket.onclose = () => {
        channelInstance.activeSockets.delete(socketId);
      };
    }

    return response;
  }

  private registerModules(modules: Constructor<Module>[]): void {
    for (const module of modules) {
      const instance = inject(module);

      this.router.registerControllers(instance.controllers ?? []);
      this.webSocketChannels.push(...instance.channels ?? []);

      this.registerModules(instance.submodules ?? []);

      for (const route of instance.routes ?? []) {
        this.router.registerRoute(...route);
      }
    }
  }

  private async setup(): Promise<void> {
    this.router.registerControllers(this.options.controllers ?? []);

    this.validator.registerRules(this.configurator.entries.validatorRules);

    this.templateCompiler.registerDirectives(
      this.configurator.entries.templateDirectives,
    );

    this.webSocketChannels.push(...this.options.channels ?? []);

    for (const route of this.options.routes ?? []) {
      this.router.registerRoute(...route);
    }

    this.registerModules([
      ...(this.options.modules ?? []),
      ...(this.options.plugins?.map((plugin) => plugin.modules).filter((
        module,
      ) => module !== undefined) ?? []),
    ] as Constructor<Module>[]);

    for (const plugin of this.options.plugins ?? []) {
      const initCallbackResult = plugin.onInit?.();

      if (initCallbackResult instanceof Promise) {
        await initCallbackResult;
      }

      this.router.registerControllers(plugin.controllers ?? []);
      this.webSocketChannels.push(...plugin.channels ?? []);

      for (const route of plugin.routes ?? []) {
        this.router.registerRoute(...route);
      }
    }
  }

  private async setupDevelopmentEnvironment(): Promise<void> {
    this.webSocketChannels.push(HotReloadChannel);

    this.addExitSignalListener(() => {
      localStorage.removeItem(this.devServerCheckKey);

      Deno.exit();
    });

    if (this.arguments.open && !localStorage.getItem(this.devServerCheckKey)) {
      try {
        await $`${
          WebClientAlias[OS as keyof typeof WebClientAlias] ?? 'open'
        } ${this.router.baseUrl()}`;
      } finally {
        localStorage.setItem(this.devServerCheckKey, 'on');
      }
    }
  }

  private setupProductionEnvironment(): void {
    this.addExitSignalListener(() => {
      const shouldQuit = confirm(
        'Are you sure you want to quit production server?',
      );

      if (shouldQuit) {
        Deno.exit();
      }
    });
  }

  public configure(options: Partial<ServerOptions>): void {
    this.options = options;
  }

  public async start(): Promise<void> {
    Deno.env.set('PRODUCTION', this.arguments.dev ? 'false' : 'true');

    if (
      this.configurator.getEnv<boolean>('TESTING') &&
      !this.configurator.entries.encryption.key
    ) {
      this.configurator.entries.encryption.key = crypto.randomUUID();
    }

    if (!this.configurator.entries.isDenoDeploy) {
      this.checkSystemRequirements();

      if (this.configurator.entries.envFile) {
        await loadDotEnv({
          allowEmptyValues: true,
          envPath: this.configurator.entries.envFile ?? '.env',
          export: true,
        });
      }
    }

    this.configurator.setup(this.options.config);

    await this.localizator.setup();

    if (!this.configurator.entries.isDenoDeploy) {
      this.arguments.dev
        ? await this.setupDevelopmentEnvironment()
        : this.setupProductionEnvironment();
    }

    try {
      await this.setup();

      const tlsCert = this.configurator.entries.tls.cert ??
        (this.configurator.entries.tls.certFile
          ? await Deno.readTextFile(this.configurator.entries.tls.certFile)
          : false);

      const tlsKey = this.configurator.entries.tls.key ??
        (this.configurator.entries.tls.keyFile
          ? await Deno.readTextFile(this.configurator.entries.tls.keyFile)
          : false);

      if (
        tlsCert && tlsKey ||
        this.configurator.entries.isProduction &&
          this.configurator.entries.tls.enabled
      ) {
        this.configurator.entries.tls.enabled = true;
      }

      const tlsConfig = this.configurator.entries.tls.enabled
        ? {
          cert: tlsCert,
          key: tlsKey,
        }
        : {};

      try {
        const server = Deno.serve({
          ...tlsConfig,
          hostname: this.configurator.entries.host,
          port: this.configurator.entries.port,
          onListen: () => {
            if (!this.configurator.entries.isDenoDeploy) {
              this.logger.info(
                `HTTP server is running on ${
                  this.configurator.entries.isProduction
                    ? `port %c${this.configurator.entries.port}`
                    : `%c${this.router.baseUrl()}`
                } %c[${OS === 'darwin' ? '⌃C' : 'Ctrl+C'} to quit]`,
                {
                  colors: ['blue', 'gray'],
                },
              );
            }
          },
        }, async (request, info) => {
          return await this.handleRequest(request, info);
        });

        this.addExitSignalListener(async () => {
          await server.shutdown();

          Deno.exit();
        });
      } catch (error) {
        if (!(error instanceof Deno.errors.AddrInUse)) {
          throw error;
        }

        throw new Error(
          `Port ${this.configurator.entries.port} is already in use. Try out port ${getAvailablePort()}`,
        );
      }

      if (this.arguments.dev) {
        let watcher: Deno.FsWatcher;

        this.addExitSignalListener(() => {
          watcher.close();

          Deno.exit();
        });

        try {
          try {
            watcher = Deno.watchFs([Deno.cwd(), 'src', 'views', 'locales']);
          } catch {
            watcher = Deno.watchFs([Deno.cwd(), 'src', 'views']);
          }
        } catch {
          watcher = Deno.watchFs([Deno.cwd(), 'src']);
        }

        const hotReloadChannel = inject(HotReloadChannel);
        const watcherNotifiers = new Map<string, number>();

        for await (const event of watcher) {
          const eventString = JSON.stringify(event);

          if (watcherNotifiers.has(eventString)) {
            clearTimeout(watcherNotifiers.get(eventString));

            watcherNotifiers.delete(eventString);
          }

          watcherNotifiers.set(
            eventString,
            setTimeout(async () => {
              watcherNotifiers.delete(eventString);

              if (event.kind === 'modify') {
                const path = event.paths[0];

                switch (true) {
                  case (path.includes('src') && path.includes('.atom.html')) ||
                    path.includes('views'):
                    hotReloadChannel.sendReloadRequest();

                    break;

                  case path.includes('locales'):
                    await this.localizator.setup();

                    break;

                  case this.configurator.entries.envFile &&
                    path.endsWith(this.configurator.entries.envFile):
                    this.logger.warn(
                      'Environment configuration has been edited. Server needs to be restarted manually',
                    );

                    break;
                }
              }
            }, 20),
          );
        }
      }
    } catch (error) {
      this.errorHandler.handle(error as Error);
    }
  }

  public [Symbol.dispose](): void {
    this.logger.warn('Server terminated');

    if (!this.configurator.entries.isDenoDeploy) {
      Deno.exit(1);
    }
  }
}
