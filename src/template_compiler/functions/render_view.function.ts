import { callerFile } from '../../utils/functions/caller_file.function.ts';
import { TemplateCompilerOptions } from '../interfaces/template_compiler_options.interface.ts';
import { resolveViewFile } from './resolve_view_file.function.ts';
import { ViewResponse } from '../../http/view_response.class.ts';

export function renderView(
  file: string,
  variables: Record<string, unknown> = {},
  options: Omit<TemplateCompilerOptions, 'file'> = {},
) {
  const caller = callerFile();

  file = resolveViewFile(caller, file);

  if (!file.endsWith('.html')) {
    file = `${file}.html`;
  }

  try {
    return new ViewResponse(file, variables, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }

    throw new Error(
      `View '${file}' does not exist`,
    );
  }
}
