import { AppConfig } from '../../configurator/interfaces/app_config.interface.ts';
import { Broadcaster } from '../../ws/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface ServerOptions {
  channels: Constructor<Broadcaster>[];
  config: Partial<AppConfig>;
  controllers: Constructor[];
  modules: Constructor<Module>[];
}
