import { TemplateCompilerOptions } from './interfaces/template_compiler_options.interface.ts';

export class View {
  constructor(
    public readonly file: string,
    public readonly variables: Record<string, unknown> = {},
    public readonly options: Omit<TemplateCompilerOptions, 'file'> = {},
  ) {}

  public async template(): Promise<string> {
    return await Deno.readTextFile(this.file);
  }
}
