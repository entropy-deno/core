export class Session {
  private isLoaded = false;

  private readonly variables = new Map<string, unknown>();

  private readonly storagePath = 'storage/sessions';

  constructor(private readonly id: string | null) {}

  private async readData(): Promise<void> {
    if (this.isLoaded) {
      return;
    }

    try {
      const sessionData = JSON.parse(
        await Deno.readTextFile(`${this.storagePath}/${this.id}.json`),
      );

      for (const [key, value] of Object.entries(sessionData)) {
        this.variables.set(key, value);
      }

      this.isLoaded = true;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }
  }

  private async writeDataToFile(): Promise<void> {
    try {
      await Deno.mkdir(this.storagePath, {
        recursive: true,
      });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }

    await Deno.writeTextFile(
      `${this.storagePath}/${this.id}.json`,
      JSON.stringify({ ...this.variables }),
    );
  }

  public async $setup(): Promise<void> {
    await this.writeDataToFile();
  }

  public all(): Record<string, unknown> {
    return { ...this.variables };
  }

  public delete(key: string): void {
    this.variables.delete(key);
  }

  public async destroy(): Promise<void> {
    try {
      await Deno.remove(`${this.storagePath}/${this.id}.json`);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }
    }

    this.isLoaded = false;

    this.variables.clear();
  }

  public get<TValue>(key: string): TValue | null {
    return this.variables.get(key) as TValue ?? null;
  }

  public has(key: string): boolean {
    return this.variables.has(key);
  }

  public async set<TValue>(key: string, value: TValue): Promise<void> {
    this.variables.set(key, value);

    await this.writeDataToFile();
  }
}
