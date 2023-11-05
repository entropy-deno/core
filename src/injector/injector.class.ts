import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { Reflector } from '../utils/reflector.class.ts';
import { ServiceResolveOptions } from './interfaces/service_resolve_options.interface.ts';

export abstract class Injector {
  private static cachedInstances = new WeakMap<Constructor, unknown>();

  private static requestScopedServices: Constructor[] = [];

  public static bind(targets: Constructor | Constructor[]): void {
    if (Array.isArray(targets)) {
      for (const target of targets) {
        const instance = this.resolve(target);

        this.cachedInstances.set(target, instance);
      }

      return;
    }

    const instance = this.resolve(targets);

    this.cachedInstances.set(targets, instance);
  }

  public static has(target: Constructor): boolean {
    return this.cachedInstances.has(target);
  }

  public static resolve<TService>(
    service: Constructor<TService>,
    { singleton = true }: ServiceResolveOptions = {},
  ): TService {
    const isSingleton = Reflector.getMetadata<boolean>('singleton', service) ??
      singleton;

    if (isSingleton && this.has(service)) {
      return this.cachedInstances.get(service) as TService;
    }

    const instance = new service();

    if (isSingleton) {
      this.cachedInstances.set(service, instance);
    }

    if (!this.requestScopedServices.includes(service)) {
      this.requestScopedServices.push(service);
    }

    return instance;
  }
}
