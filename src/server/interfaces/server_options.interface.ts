import { AppConfig } from './app_config.interface.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface ServerOptions {
  config?: AppConfig;
  modules: Constructor<Module>[];
}
