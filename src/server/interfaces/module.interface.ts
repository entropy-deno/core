import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';

export interface Module {
  readonly channels?: Constructor<Broadcaster>[];
  readonly controllers?: Constructor<Controller>[];
  readonly submodules?: Constructor<Module>[];
}
