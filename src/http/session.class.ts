import { exists } from 'https://deno.land/std@0.201.0/fs/mod.ts';

export class Session {
  constructor(private readonly id: string | null) {}

  public async setup(): Promise<void> {
    const path = `storage/sessions/${this.id}`;

    if (!await exists(path)) {
      await Deno.mkdir(path, {
        recursive: true,
      });
    }

    await Deno.writeTextFile(
      `${path}/${this.id}.json`,
      JSON.stringify({}),
    );
  }
}
