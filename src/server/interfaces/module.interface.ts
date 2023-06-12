import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/interfaces/controller.interface.ts';

export interface Module {
  controllers?: Constructor<Controller>[];
}
