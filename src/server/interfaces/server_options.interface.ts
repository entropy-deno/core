import { AppConfig } from '../../configurator/interfaces/app_config.interface.ts';
import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../http/controller.class.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface ServerOptions {
  channels: Constructor<Broadcaster>[];
  config: Partial<AppConfig>;
  controllers: Constructor<Controller>[];
  modules: Constructor<Partial<Module>>[];
}
