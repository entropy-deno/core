import { Authorizer } from '../../http/interfaces/authorizer.interface.ts';
import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Channel } from '../../web_socket/decorators/channel.decorator.ts';

@Channel('@entropy/hot-reload')
export class HotReloadChannel extends Broadcaster implements Authorizer {
  public authorize(): boolean {
    return true;
  }

  public sendReloadRequest() {
    this.broadcast({
      reload: true,
    });
  }
}
