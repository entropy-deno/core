import { callerFile } from '../../utils/functions/caller_file.function.ts';
import { CompileOptions } from '../interfaces/compile_options.interface.ts';
import { inject } from '../../injector/functions/inject.function.ts';
import { resolveViewFile } from './resolve_view_file.function.ts';
import { TemplateCompiler } from '../template_compiler.service.ts';

export async function render(
  file: string,
  data: Record<string, unknown> = {},
  options: CompileOptions = {},
) {
  const caller = callerFile();

  file = resolveViewFile(caller, file);

  if (!file.endsWith('.html')) {
    file = `${file}.html`;
  }

  try {
    const fileContent = await Deno.readTextFile(file);

    const html = await inject(TemplateCompiler).compile(fileContent, data, {
      file,
      ...options,
    });

    TemplateCompiler.stacks.clear();

    return await inject(TemplateCompiler).compile(html, data, {
      file,
    });
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }

    throw new Error(
      `View '${file}' does not exist`,
    );
  }
}
