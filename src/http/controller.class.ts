import { HttpStatus } from './enums/http_status.enum.ts';
import { TemplateCompilerOptions } from '../template_compiler/interfaces/template_compiler_options.interface.ts';
import { resolveViewFile } from '../template_compiler/functions/resolve_view_file.function.ts';
import { RoutePath } from '../router/types/route_path.type.ts';
import { Utils } from '../utils/utils.class.ts';
import { ViewResponse } from './view_response.class.ts';

export abstract class Controller {
  protected redirectResponse(
    url: string | RoutePath,
    statusCode: HttpStatus,
  ): Response {
    return Response.redirect(url, statusCode);
  }

  protected renderView(
    file: string,
    variables: Record<string, unknown> = {},
    options: Omit<TemplateCompilerOptions, 'file'> = {},
  ) {
    const caller = Utils.callerFile();

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
}
