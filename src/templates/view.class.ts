import { TemplateCompilerOptions } from './interfaces/template_compiler_options.interface.ts';

export class View {
  constructor(
    public readonly file: string,
    public readonly variables: Record<string, unknown> = {},
    public readonly options: Omit<TemplateCompilerOptions, 'file'> = {},
  ) {}

  public async assertExists(): Promise<void> {
    try {
      await Deno.stat(this.file);
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        throw error;
      }

      throw new Error(
        `View '${
          this.file.split('.atom.html')[0].split('/').pop()
        }' does not exist`,
      );
    }
  }

  public async getTemplate(): Promise<string> {
    return await Deno.readTextFile(this.file);
  }
}
