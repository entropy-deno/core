import { Reflector } from '../utils/reflector.class.ts';

export abstract class Broadcaster {
  public readonly activeSockets = new Map<string, WebSocket>();

  public broadcast(
    payload: Record<string, unknown> = {},
    channel?: string,
  ): void {
    for (const socket of this.activeSockets.values()) {
      if (!channel) {
        channel = Reflector.getMetadata<string>(
          'name',
          this.constructor,
        );
      }

      const path = `${channel?.[0] === '/' ? '' : '/'}${channel}`;

      const pattern = new URLPattern({
        pathname: path,
      });

      if (pattern?.test({ pathname: path })) {
        socket?.send(JSON.stringify({
          channel,
          payload,
        }));
      }
    }
  }
}
