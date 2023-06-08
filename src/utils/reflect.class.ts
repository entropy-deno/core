import { Constructor } from './interfaces/constructor.interface.ts';

export class Reflect {
  private static metadata = new WeakMap<Constructor, Record<string, unknown>>();

  public static defineMetadata<T>(
    key: string,
    value: T,
    Constructor: Constructor,
  ): void {
    this.metadata.set(Constructor, {
      [key]: value,
      ...(this.metadata.has(Constructor) ? this.metadata.get(Constructor) : {}),
    });
  }

  public static getMetadata<T>(
    key: string,
    Constructor: Constructor,
  ): T | undefined {
    return this.metadata.get(Constructor)?.[key] as T | undefined;
  }

  public static hasMetadata(key: string, Constructor: Constructor): boolean {
    return this.metadata.has(Constructor) && key in this.metadata.get(Constructor)!;
  }
}
