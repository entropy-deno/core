export abstract class Reflector {
  private static metadata = new WeakMap<object, Record<string, unknown>>();

  public static defineMetadata<TValue>(
    key: string,
    value: TValue,
    target: object,
  ): void {
    this.metadata.set(target, {
      [key]: value,
      ...(this.metadata.has(target) ? this.metadata.get(target) : {}),
    });
  }

  public static getMetadata<TValue>(
    key: string,
    target: object,
  ): TValue | undefined {
    return this.metadata.get(target)?.[key] as TValue | undefined;
  }

  public static hasMetadata(key: string, target: object): boolean {
    return this.metadata.has(target) && key in this.metadata.get(target)!;
  }
}
