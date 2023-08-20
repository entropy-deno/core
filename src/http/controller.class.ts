import { HttpStatus } from './enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { TemplateCompilerOptions } from '../templates/interfaces/template_compiler_options.interface.ts';
import { RedirectDestination } from '../router/types/redirect_destination.type.ts';
import { Router } from '../router/router.service.ts';
import { Utils } from '../utils/utils.class.ts';
import { ViewResponse } from './view_response.class.ts';

export abstract class Controller {
  protected redirectResponse(
    destination: RedirectDestination,
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

    file = Utils.resolveViewFile(caller, file);

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
