import { TemplateCompilerOptions } from '../template_compiler/interfaces/template_compiler_options.interface.ts';

export class ViewResponse {
  constructor(
    public readonly file: string,
    public readonly variables: Record<string, unknown> = {},
    public readonly options: Omit<TemplateCompilerOptions, 'file'> = {},
  ) {}

  public async template(): Promise<string> {
    return await Deno.readTextFile(this.file);
  }
}
