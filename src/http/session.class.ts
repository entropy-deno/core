import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Session {
  private readonly configurator = inject(Configurator);

  private kv: Deno.Kv | null = null;

  private kvStorageKey: string[] = [];

  constructor(private readonly id: string | null) {}

  public async $setup(): Promise<void> {
    if (!this.id) {
      return;
    }

    this.kv = await Deno.openKv();
    this.kvStorageKey = ['@entropy', 'sessions', this.id];
  }

  public async all(): Promise<Record<string, unknown>> {
    const entries = this.kv?.list({
      prefix: this.kvStorageKey,
    });

    if (!entries) {
      return {};
    }

    const all: Record<string, unknown> = {};

    for await (const entry of entries) {
      all[[...entry.key].pop() as string] = entry.value;
    }

    return all;
  }

  public async delete(key: string): Promise<void> {
    await this.kv?.delete([...this.kvStorageKey, key]);
  }

  public async destroy(): Promise<void> {
    await this.kv?.delete(this.kvStorageKey);
  }

  public async get<TValue>(key: string): Promise<TValue | null> {
    return (await this.kv?.get<Record<string, TValue>>([
      ...this.kvStorageKey,
      key,
    ]))?.value as TValue ?? null;
  }

  public async has(key: string): Promise<boolean> {
    return ![null, undefined].includes(await this.get(key));
  }

  public async set(key: string, value: unknown): Promise<void> {
    await this.kv?.set([...this.kvStorageKey, key], value, {
      expireIn: this.configurator.entries.session.lifetime * 24 * 3600 * 1000,
    });
  }
}
