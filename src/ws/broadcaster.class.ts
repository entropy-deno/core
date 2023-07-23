import { Reflector } from '../utils/reflector.class.ts';

export abstract class Broadcaster {
  public readonly activeSockets = new Map<string, WebSocket>();

  protected broadcast(payload: unknown = {}, channel?: string): void {
    for (const socket of this.activeSockets.values()) {
      const channelName = Reflector.getMetadata<string>('name', this);

      const pattern = new URLPattern({
        pathname: `${channelName?.[0] === '/' ? '' : '/'}${channelName}`,
      });

      if (!channel) {
        channel = channelName;
      }

      if (
        pattern?.test({ pathname: `${channel?.[0] === '/' ? '' : '/'}${channel}` })
      ) {
        socket?.send(JSON.stringify(payload));
      }
    }
  }
}
