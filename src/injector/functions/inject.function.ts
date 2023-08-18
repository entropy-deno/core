import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { Injector } from '../injector.class.ts';
import { ServiceResolveOptions } from '../interfaces/service_resolve_options.interface.ts';

export function inject<TTarget>(
  service: Constructor<TTarget>,
  options: Partial<ServiceResolveOptions> = {},
): TTarget {
  return Injector.resolve<TTarget>(service, options);
}
