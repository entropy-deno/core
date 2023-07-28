import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Injector } from '../injector.class.ts';
import { ServiceResolveOptions } from '../interfaces/service_resolve_options.interface.ts';

export function inject<T>(
  service: Constructor<T>,
  options: ServiceResolveOptions = {},
): T {
  return Injector.resolve<T>(service, options);
}
