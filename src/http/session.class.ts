import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TimeUnit } from '../scheduler/enums/time_unit.enum.ts';

interface FlashedData {
  requestId: number;
  value: unknown;
}

export class Session {
  private readonly configurator = inject(Configurator);

  private kv: Deno.Kv | null = null;

  private kvStorageKey: string[] = [];

  constructor(private readonly id?: string) {}

  private async serialize(
    key: string | string[] = [],
  ): Promise<Record<string, unknown>> {
    const entries = this.kv?.list({
      prefix: [...this.kvStorageKey, ...(Array.isArray(key) ? key : [key])],
    });

    if (!entries) {
      return {};
    }

    const records: Record<string, unknown> = {};

    for await (const entry of entries) {
      records[[...entry.key].pop() as string] = entry.value;
    }

    return records;
  }

  public async all(): Promise<Record<string, unknown>> {
    return await this.serialize();
  }

  public async decrement(
    key: string | string[],
    by = 1,
    defaultValue?: number,
  ): Promise<number> {
    if (!await this.has(key) && defaultValue !== undefined) {
      await this.set(key, defaultValue);
    }

    const value = await this.get(key);

    if (typeof value !== 'number') {
      throw new TypeError(
        `Cannot decrement session value '${
          Array.isArray(key) ? key.pop() : key
        }' as it is not a number`,
      );
    }

    await this.set(key, value - by);

    return value - by;
  }

  public async delete(key: string | string[]): Promise<void> {
    await this.kv?.delete([
      ...this.kvStorageKey,
      ...(Array.isArray(key) ? key : [key]),
    ]);
  }

  public async destroy(): Promise<void> {
    await this.kv?.delete(this.kvStorageKey);
  }

  public async flash(key: string, value: unknown): Promise<void> {
    await this.set(['_entropy', 'flash', key], {
      requestId: await this.get('_request_id'),
      value,
    });
  }

  public async flashed<TValue = unknown>(
    key: string,
  ): Promise<TValue | undefined> {
    return (await this.get<FlashedData>(['_entropy', 'flash', key]))?.value as
      | TValue
      | undefined;
  }

  public async get<TValue>(
    key: string | string[],
  ): Promise<TValue | undefined> {
    return (await this.kv?.get<Record<string, TValue>>([
      ...this.kvStorageKey,
      ...(Array.isArray(key) ? key : [key]),
    ]))?.value as TValue;
  }

  public async has(key: string | string[]): Promise<boolean> {
    return ![null, undefined].includes(await this.get(key));
  }

  public async increment(
    key: string | string[],
    by = 1,
    defaultValue?: number,
  ): Promise<number> {
    if (!await this.has(key) && defaultValue !== undefined) {
      await this.set(key, defaultValue);
    }

    const value = await this.get(key);

    if (typeof value !== 'number') {
      throw new TypeError(
        `Cannot increment session value '${
          Array.isArray(key) ? key.pop() : key
        }' as it is not a number`,
      );
    }

    await this.set(key, value + by);

    return value + by;
  }

  public async save(): Promise<void> {
    const flashed = await this.serialize(['_entropy', 'flash']);
    const currentRequestId =
      await this.get<number>(['_entropy', 'request_id']) ?? 0;

    for (const [key, value] of Object.entries(flashed)) {
      if ((value as FlashedData).requestId < currentRequestId - 1) {
        await this.delete(['_entropy', 'flash', key]);
      }
    }
  }

  public async set(key: string | string[], value: unknown): Promise<void> {
    await this.kv?.set(
      [...this.kvStorageKey, ...(Array.isArray(key) ? key : [key])],
      value,
      {
        expireIn: this.configurator.entries.session.lifetime * 24 *
          TimeUnit.Hour,
      },
    );
  }

  public async setup(): Promise<void> {
    if (!this.id) {
      return;
    }

    if (!this.kv) {
      this.kv = await Deno.openKv();
    }

    this.kvStorageKey = ['@entropy', 'sessions', this.id];
  }
}
