import { AnonymousRoute } from '../types/anonymous_route.type.ts';
import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';

export interface Module {
  readonly channels?: Constructor<Broadcaster>[];
  readonly controllers?: Constructor<Controller>[];
  readonly routes?: AnonymousRoute[];
  readonly submodules?: Constructor<Module>[];
}
