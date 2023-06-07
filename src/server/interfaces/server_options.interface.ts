import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Module } from '../interfaces/module.interface.ts';

export interface ServerOptions {
  modules: Constructor<Module>[];
}
