import { CompileOptions } from '../interfaces/compile_options.interface.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { TemplateCompiler } from '../template_compiler.service.ts';

export function compileTemplate(
  template: string,
  variables: Record<string, unknown> = {},
  options: CompileOptions = {},
) {
  return inject(TemplateCompiler).compile(template, variables, options);
}
