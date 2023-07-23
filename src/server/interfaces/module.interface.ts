import { Broadcaster } from '../../ws/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';

export interface Module {
  channels?: Constructor<Broadcaster>[];
  controllers?: Constructor[];
}
