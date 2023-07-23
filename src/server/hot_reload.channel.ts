import { Broadcaster } from '../ws/broadcaster.class.ts';
import { WsChannel } from '../ws/decorators/ws_channel.decorator.ts';

@WsChannel('$hot-reload')
export class HotReloadChannel extends Broadcaster {
  public sendReloadRequest(path: string) {
    this.broadcast({
      path,
    }, '$hot-reload');
  }
}
