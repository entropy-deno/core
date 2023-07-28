import { TemplateCompilerOptions } from '../interfaces/template_compiler_options.interface.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { TemplateCompiler } from '../template_compiler.service.ts';

export function renderTemplate(
  template: string,
  variables: Record<string, unknown> = {},
  options: TemplateCompilerOptions = {},
) {
  return inject(TemplateCompiler).render(template, variables, options);
}
