import { Reflector } from '../utils/reflector.class.ts';

export abstract class Broadcaster {
  public readonly activeSockets = new Map<string, WebSocket>();

  public broadcast(
    payload: Record<string, unknown> = {},
    channel?: string,
  ): void {
    for (const socket of this.activeSockets.values()) {
      const channelName = Reflector.getMetadata<string>(
        'name',
        this.constructor,
      );

      if (!channel) {
        channel = channelName;
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
