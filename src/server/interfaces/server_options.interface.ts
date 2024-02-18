import { AnonymousRoute } from '../../router/types/anonymous_route.type.ts';
import { AppConfig } from '../../configurator/interfaces/app_config.interface.ts';
import { Broadcaster } from '../../web_socket/broadcaster.class.ts';
import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Controller } from '../../router/controller.class.ts';
import { DeepPartial } from '../../utils/types/deep_partial.type.ts';
import { Module } from '../interfaces/module.interface.ts';
import { Plugin } from '../../utils/interfaces/plugin.interface.ts';

export interface ServerOptions {
  channels?: Constructor<Broadcaster>[];
  config?: DeepPartial<AppConfig>;
  controllers?: Constructor<Controller>[];
  modules?: Constructor<Module>[];
  plugins?: Plugin[];
  routes?: AnonymousRoute[];
}
