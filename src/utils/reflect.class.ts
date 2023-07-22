export class Reflect {
  private static metadata = new WeakMap<object, Record<string, unknown>>();

  public static defineMetadata<T>(
    key: string,
    value: T,
    target: object,
  ): void {
    this.metadata.set(target, {
      [key]: value,
      ...(this.metadata.has(target) ? this.metadata.get(target) : {}),
    });
  }

  public static getMetadata<T>(
    key: string,
    target: object,
  ): T | undefined {
    return this.metadata.get(target)?.[key] as T | undefined;
  }

  public static hasMetadata(key: string, target: object): boolean {
    return this.metadata.has(target) && key in this.metadata.get(target)!;
  }
}
