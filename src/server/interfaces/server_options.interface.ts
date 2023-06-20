import { AppConfig } from '../../configurator/interfaces/app_config.interface.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface ServerOptions {
  config?: Partial<AppConfig>;
  controllers?: Constructor<any>[];
  modules: Constructor<Module>[];
}
