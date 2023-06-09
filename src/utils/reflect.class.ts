import { Constructor } from './interfaces/constructor.interface.ts';

type Target = Constructor | ((...args: unknown[]) => unknown);

export class Reflect {
  private static metadata = new WeakMap<Target, Record<string, unknown>>();

  public static defineMetadata<T>(
    key: string,
    value: T,
    target: Target,
  ): void {
    this.metadata.set(target, {
      [key]: value,
      ...(this.metadata.has(target) ? this.metadata.get(target) : {}),
    });
  }

  public static getMetadata<T>(
    key: string,
    target: Target,
  ): T | undefined {
    return this.metadata.get(target)?.[key] as T | undefined;
  }

  public static hasMetadata(key: string, target: Target): boolean {
    return this.metadata.has(target) && key in this.metadata.get(target)!;
  }
}
