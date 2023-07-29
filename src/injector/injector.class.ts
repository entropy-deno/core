import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { ServiceResolveOptions } from './interfaces/service_resolve_options.interface.ts';

export class Injector {
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

  public static resolve<T>(
    target: Constructor<T>,
    options: Partial<ServiceResolveOptions> = {},
  ): T | never {
    if ((options.singleton ?? true) && this.has(target)) {
      return this.cachedInstances.get(target) as T;
    }

    const instance = new target();

    if (options.singleton ?? true) {
      this.cachedInstances.set(target, instance);
    }

    if (!this.requestScopedServices.includes(target)) {
      this.requestScopedServices.push(target);
    }

    return instance;
  }
}
