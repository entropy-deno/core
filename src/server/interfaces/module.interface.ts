import { Broadcaster } from '../../ws/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/interfaces/controller.interface.ts';

export interface Module {
  channels?: Constructor<Broadcaster>[];
  controllers?: Constructor<Controller>[];
}
