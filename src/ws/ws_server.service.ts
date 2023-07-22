import { Broadcaster } from '../ws/broadcaster.class.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { Logger } from '../logger/logger.service.ts';

export class WsServer {
  private readonly channels: Constructor<Broadcaster>[] = [];

  private readonly configurator = inject(Configurator);

  private readonly encryoter = inject(Encrypter);

  private readonly logger = inject(Logger);

  private handleConnection(request: Request): Response {
    const url = new URL(request.url);

    if (
      url.protocol === 'ws' &&
      request.headers.get('upgrade')?.toLowerCase() !== 'websocket'
    ) {
      throw new HttpError(HttpStatus.UpgradeRequired);
    }

    const { socket, response } = Deno.upgradeWebSocket(request);

    if (
      !this.configurator.entries.isProduction &&
      url.pathname === '/$entropy/hot-reload'
    ) {
      let watcher: Deno.FsWatcher;

      try {
        watcher = Deno.watchFs(['src', 'views']);
      } catch {
        watcher = Deno.watchFs('src');
      }

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

    for (const channel of this.channels) {
      const channelInstance = inject(channel);
      const socketId = this.encryoter.uuid();

      socket.onopen = () => {
        channelInstance.activeSockets.set(socketId, socket);
      };

      socket.onclose = () => {
        channelInstance.activeSockets.delete(socketId);
      };
    }

    return response;
  }

  public registerChannel(channel: Constructor<Broadcaster>): void {
    this.channels.push(channel);
  }

  public registerChannels(channels: Constructor<Broadcaster>[]): void {
    for (const channel of channels) {
      this.registerChannel(channel);
    }
  }

  public start(): void {
    Deno.serve({
      hostname: this.configurator.entries.host,
      port: this.configurator.entries.wsPort,
      onListen: () => {
        if (!this.configurator.entries.isDenoDeploy) {
          this.logger.info(
            `WS server is running on %cport ${this.configurator.entries.port}`,
            {
              badge: 'WS',
              colors: ['blue'],
            },
          );
        }
      },
    }, (request) => this.handleConnection(request));
  }
}
