import { Broadcaster } from '../../ws/broadcaster.class.ts';
import { Channel } from '../../ws/decorators/channel.decorator.ts';

@Channel('$hot-reload')
export class HotReloadChannel extends Broadcaster {
  public sendReloadRequest() {
    this.broadcast({
      reload: true,
    });
  }
}
