import { CompileOptions } from '../template_compiler/interfaces/compile_options.interface.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompiler } from '../template_compiler/template_compiler.service.ts';

export class ViewResponse {
  constructor(
    public readonly file: string,
    public readonly variables: Record<string, unknown> = {},
    public readonly options: Omit<CompileOptions, 'file'> = {},
  ) {}

  public async template(): Promise<string> {
    const fileContent = await Deno.readTextFile(this.file);

    const compiled = await inject(TemplateCompiler).compile(
      fileContent,
      this.variables,
      {
        file: this.file,
        ...this.options,
      },
    );

    TemplateCompiler.stacks.clear();

    return compiled;
  }
}
