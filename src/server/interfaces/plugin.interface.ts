import { AnonymousRoute } from '../types/anonymous_route.type.ts';
import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../router/controller.class.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface Plugin {
  channels?: Constructor<Broadcaster>[];
  controllers?: Constructor<Controller>[];
  modules?: Constructor<Module>[];
  name: string;
  onInit?: () => void | Promise<void>;
  routes?: AnonymousRoute[];
}
