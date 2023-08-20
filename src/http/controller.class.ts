import { HttpStatus } from './enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompilerOptions } from '../templates/interfaces/template_compiler_options.interface.ts';
import { resolveViewFile } from '../templates/functions/resolve_view_file.function.ts';
import { Router } from '../router/router.service.ts';
import { RoutePath } from '../router/types/route_path.type.ts';
import { Url } from '../router/types/url.type.ts';
import { Utils } from '../utils/utils.class.ts';
import { ViewResponse } from './view_response.class.ts';

export abstract class Controller {
  protected redirectResponse(
    destination: RoutePath | Url | {
      name: string;
      params?: Record<string, string>;
    },
    statusCode = HttpStatus.Found,
  ): Response {
    return inject(Router).createRedirect(destination, statusCode);
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
