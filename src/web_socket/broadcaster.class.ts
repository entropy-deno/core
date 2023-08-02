import { Reflector } from '../utils/reflector.class.ts';

export abstract class Broadcaster {
  public readonly activeSockets = new Map<string, WebSocket>();

  public broadcast(
    payload: Record<string, unknown> = {},
    channel?: string,
  ): void {
    for (const socket of this.activeSockets.values()) {
      const channelName = Reflector.getMetadata<string>('name', this.constructor);

      if (!channel) {
        channel = channelName;
      }

      const pattern = new URLPattern({
        pathname: `${channel?.[0] === '/' ? '' : '/'}${channel}`,
      });

      if (
        pattern?.test({ pathname: `${channel?.[0] === '/' ? '' : '/'}${channel}` })
      ) {
        socket?.send(JSON.stringify({
          channel,
          payload,
        }));
      }
    }
  }
}
