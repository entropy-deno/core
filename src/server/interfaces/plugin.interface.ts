import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface Plugin {
  channels?: Constructor<Broadcaster>[];
  controllers?: Constructor<Controller>[];
  modules?: Constructor<Partial<Module>>[];
  name: string;
  onInit?: () => void | Promise<void>;
}
