import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Injector } from '../injector.class.ts';
import { ServiceResolveOptions } from '../interfaces/service_resolve_options.interface.ts';

export function inject<TService>(
  service: Constructor<TService>,
  options: Partial<ServiceResolveOptions> = {},
): TService {
  return Injector.resolve<TService>(service, options);
}
