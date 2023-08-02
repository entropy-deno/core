import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';

export interface Module {
  channels?: Constructor<Broadcaster>[];
  controllers?: Constructor<Controller>[];
}
