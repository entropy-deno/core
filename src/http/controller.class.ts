import { Json } from './json.class.ts';
import { TemplateCompilerOptions } from '../templates/interfaces/template_compiler_options.interface.ts';
import { Utils } from '../utils/utils.class.ts';
import { View } from '../templates/view.class.ts';

export abstract class Controller {
  protected json(json: object): Json {
    return new Json(json);
  }

  protected async render(
    file: string,
    variables: Record<string, unknown> = {},
    options: Omit<TemplateCompilerOptions, 'file'> = {},
  ): Promise<View> {
    const caller = Utils.callerFile();

    file = Utils.resolveViewFile(caller, file);

    if (!file.endsWith('.atom.html')) {
      file = `${file}.atom.html`;
    }

    const view = new View(file, variables, options);

    await view.assertExists();

    return view;
  }
}
