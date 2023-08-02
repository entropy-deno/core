import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Channel } from '../../web_socket/decorators/channel.decorator.ts';

@Channel('$hot-reload')
export class HotReloadChannel extends Broadcaster {
  public sendReloadRequest() {
    this.broadcast({
      reload: true,
    });
  }
}
