import { CompileOptions } from '../template_compiler/interfaces/compile_options.interface.ts';

export class ViewResponse {
  constructor(
    public readonly file: string,
    public readonly variables: Record<string, unknown> = {},
    public readonly options: Omit<CompileOptions, 'file'> = {},
  ) {}

  public async template(): Promise<string> {
    return await Deno.readTextFile(this.file);
  }
}
