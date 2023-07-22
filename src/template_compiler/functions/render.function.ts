import { callerFile } from '../../utils/functions/caller_file.function.ts';
import { CompileOptions } from '../interfaces/compile_options.interface.ts';
import { resolveViewFile } from './resolve_view_file.function.ts';
import { ViewResponse } from '../../http/view_response.class.ts';

export function render(
  file: string,
  data: Record<string, unknown> = {},
  options: Omit<CompileOptions, 'file'> = {},
) {
  const caller = callerFile();

  file = resolveViewFile(caller, file);

  if (!file.endsWith('.html')) {
    file = `${file}.html`;
  }

  try {
    return new ViewResponse(file, data, options);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }

    throw new Error(
      `View '${file}' does not exist`,
    );
  }
}
