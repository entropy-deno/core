import { Broadcaster } from '../web_socket/broadcaster.class.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { HttpError } from '../http/http_error.class.ts';
import { HttpStatus } from '../http/enums/http_status.enum.ts';
import { Logger } from '../logger/logger.service.ts';

export class WebSocketServer {
  private readonly channels: Constructor<Broadcaster>[] = [];

  private readonly configurator = inject(Configurator);

  private readonly encryoter = inject(Encrypter);

  private readonly logger = inject(Logger);

  private handleConnection(request: Request): Response {
    if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') {
      throw new HttpError(HttpStatus.UpgradeRequired);
    }

    const { socket, response } = Deno.upgradeWebSocket(request);

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

  public async start(): Promise<void> {
    if (
      this.configurator.entries.webSocket.port === this.configurator.entries.port
    ) {
      throw new Error(
        `WebSocket port ${this.configurator.entries.webSocket.port} is already in use`,
      );
    }

    const tlsCert = this.configurator.entries.tls.cert ??
      (this.configurator.entries.tls.certFile
        ? await Deno.readTextFile(this.configurator.entries.tls.certFile)
        : false);

    const tlsKey = this.configurator.entries.tls.key ??
      (this.configurator.entries.tls.keyFile
        ? await Deno.readTextFile(this.configurator.entries.tls.keyFile)
        : false);

    Deno.serve({
      ...(this.configurator.entries.tls.enabled
        ? {
          cert: tlsCert,
          key: tlsKey,
        }
        : {}),
      hostname: this.configurator.entries.host,
      port: this.configurator.entries.webSocket.port,
      onListen: () => {
        if (!this.configurator.entries.isDenoDeploy) {
          this.logger.info(
            `Broadcasting on port %c${this.configurator.entries.webSocket.port}`,
            {
              badge: 'WebSocket',
              colors: ['blue'],
            },
          );
        }
      },
    }, (request) => this.handleConnection(request));
  }
}