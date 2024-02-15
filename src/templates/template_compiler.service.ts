import { resolve as resolvePath } from 'https://deno.land/std@0.216.0/path/mod.ts';
import * as constants from '../constants.ts';
import * as pipes from '../pipes/pipes.module.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { env } from '../configurator/functions/env.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { NonSingleton } from '../injector/decorators/non_singleton.decorator.ts';
import { Pipe } from '../pipes/interfaces/pipe.interface.ts';
import { TemplateCompilerOptions } from './interfaces/template_compiler_options.interface.ts';
import { TemplateDirective } from './interfaces/template_directive.interface.ts';
import { url } from '../router/functions/url.function.ts';
import { Utils } from '../utils/utils.class.ts';

@NonSingleton()
export class TemplateCompiler {
  private readonly configurator = inject(Configurator);

  private readonly encrypter = inject(Encrypter);

  private readonly functions = {
    '$env': env,
    '$escape': Utils.escapeEntities,
    '$inject': inject,
    '$range': Utils.range,
    '$url': url,
  };

  private layout?: string;

  private layoutFile?: string;

  private layoutSections = new Map<string, string>();

  private options: TemplateCompilerOptions = {};

  private pipes: Record<string, (...args: unknown[]) => unknown> = Object
    .entries(pipes).reduce((result, [, pipe]) => {
      const instance = inject(pipe as Constructor<Pipe>);

      return {
        ...result,
        [instance.alias!]: instance.transform,
      };
    }, {});

  private template = '';

  private variables: Record<string, unknown> = {};

  public static directives: TemplateDirective[] = [];

  public rawContent = new Map<string, string>();

  public static stacks = new Map<string, string[]>();

  constructor() {
    TemplateCompiler.directives = [
      {
        name: 'raw',
        type: 'block',
        render: (content: string) => {
          const id = this.encrypter.generateUuid();

          this.rawContent.set(id, content);

          return `$__raw__${id}`;
        },
      },
      {
        name: 'if',
        type: 'block',
        render: (content: string, condition: unknown) => {
          const [ifContent, elseContent] = content.split('@else');

          if (condition) {
            return ifContent;
          }

          return elseContent ?? '';
        },
      },
      {
        name: 'switch',
        type: 'block',
        render: async (content: string, condition: unknown) => {
          const cases = new Map<unknown, string>();

          let defaultCaseValue: string | null = null;

          const caseMatches = content.matchAll(
            /@(case|default)\s*\(([^\n]*)\)(.*?)@\/(case|default)/gs,
          );

          for (
            const [
              ,
              caseType,
              caseConditionString,
              caseContent,
              closingCaseType,
            ] of caseMatches
          ) {
            if (caseType !== closingCaseType) {
              throw new Error(`Not closed @${caseType} directive`);
            }

            if (caseType === 'default') {
              if (defaultCaseValue) {
                throw new Error(
                  'Double @switch directive default case defined',
                );
              }

              defaultCaseValue = caseContent;

              continue;
            }

            const caseRegex = /@case ?(.*?)/g;
            const cleanCaseContent = caseContent.replaceAll(caseRegex, '');

            cases.set(
              await this.renderNatively(
                `return ${caseConditionString};`,
              ),
              cleanCaseContent,
            );

            const parallelCaseMatches = caseContent.matchAll(caseRegex);

            for (const [, parallelCaseConditionString] of parallelCaseMatches) {
              cases.set(
                await this.renderNatively(
                  `return ${parallelCaseConditionString};`,
                ),
                cleanCaseContent,
              );
            }
          }

          for (const [key, value] of cases) {
            if (key === condition) {
              return value;
            }
          }

          if (defaultCaseValue) {
            return defaultCaseValue;
          }
        },
      },
      {
        name: 'csrf',
        type: 'single',
        render: async () => {
          return `<input type="hidden" name="_token" value="${await this.options
            .request
            ?.session.get<string>(['_entropy', 'csrf_token'])}">`;
        },
      },
      {
        name: 'dev',
        type: 'block',
        render: (content: string) => {
          return this.configurator.entries.isProduction ? '' : content;
        },
      },
      {
        name: 'embed',
        type: 'single',
        render: async (files: string | string[], minify = false) => {
          let result = '';

          for (const file of Array.isArray(files) ? files : [files]) {
            if (
              !file.endsWith('.css') && !file.endsWith('.js') &&
              !file.endsWith('.svg')
            ) {
              throw new Error(
                `Unsupported file extension of embedded file '${file}'`,
              );
            }

            const path = `public/${
              file.startsWith('public') ? file.slice(6) : file
            }`;

            try {
              const content = await Deno.readTextFile(path);

              switch (file.split('.').pop()) {
                case 'css': {
                  result += `<style nonce="${
                    this.options.request?.nonce ?? ''
                  }">${
                    minify ? content.replaceAll(/\n|\t|(\r\n)/g, '') : content
                  }</style>`;

                  break;
                }

                case 'js': {
                  result += `<script nonce="${
                    this.options.request?.nonce ?? ''
                  }">${
                    minify ? content.replaceAll(/\n|\t|(\r\n)/g, '') : content
                  }</script>`;

                  break;
                }

                case 'svg': {
                  result += `${
                    minify ? content.replaceAll(/\n|\t|(\r\n)/g, '') : content
                  }`;

                  break;
                }
              }
            } catch (error) {
              if (!(error instanceof Deno.errors.NotFound)) {
                throw error;
              }

              throw new Error(
                `Static embedded file '${file}' does not exist`,
              );
            }
          }

          return result;
        },
      },
      {
        name: 'error',
        type: 'block',
        render: async (content: string, invalidField: string) => {
          const errorMessages =
            await this.options.request?.flashed<Record<string, string[]>>(
              '$errors',
            ) ?? {};

          if (invalidField in errorMessages) {
            const compiler = inject(TemplateCompiler);

            return await compiler.render(content, {
              ...this.variables,
              $message: errorMessages[invalidField]?.[0],
            }, {
              recursiveCall: true,
              request: this.options.request,
            });
          }
        },
      },
      {
        name: 'error',
        type: 'single',
        render: async (invalidField: string) => {
          const message =
            (await this.options.request?.flashed<Record<string, string[]>>(
              '$errors',
            ))?.[invalidField]?.[0];

          if (message) {
            return message;
          }
        },
      },
      {
        name: 'escape',
        type: 'block',
        render: (content: string) => {
          return Utils.escapeEntities(content);
        },
      },
      {
        name: 'hotReload',
        type: 'single',
        render: () => {
          return this.configurator.entries.isProduction ? '' : `
            <script nonce="${this.options.request?.nonce ?? ''}">
              const $entropySocket = new WebSocket('${
            this.configurator.entries.tls.enabled ? 'wss' : 'ws'
          }://${this.configurator.entries.host}:${this.configurator.entries.port}');

              $entropySocket.onmessage = (event) => {
                if (JSON.parse(event.data).channel === '@entropy/hot-reload') {
                  window.location.reload();
                }
              };

              $entropySocket.onclose = () => console.error('[entropy] Hot reload disconnected');
            </script>
          `;
        },
      },
      {
        name: 'json',
        type: 'single',
        render: (json: unknown, prettyPrint = false, indent = 2) => {
          try {
            return JSON.stringify(json, undefined, prettyPrint ? indent : 0);
          } catch {
            throw new Error(`Invalid JSON data '${String(json).slice(0, 32)}'`);
          }
        },
      },
      {
        name: 'method',
        type: 'single',
        render: (method: string) => {
          if (!([...Object.values(HttpMethod)] as string[]).includes(method)) {
            throw new Error(`Unsupported HTTP method '${method}'`);
          }

          method = method.toUpperCase();

          return `<input type="hidden" name="_method" value="${method}">`;
        },
      },
      {
        name: 'nonceProp',
        type: 'single',
        render: () => {
          return `nonce="${this.options.request?.nonce ?? ''}"`;
        },
      },
      {
        name: 'nonce',
        type: 'single',
        render: () => {
          return this.options.request?.nonce ?? '';
        },
      },
      {
        name: 'prod',
        type: 'block',
        render: (content: string) => {
          return this.configurator.entries.isProduction ? content : '';
        },
      },
      {
        name: 'push',
        type: 'block',
        render: (content: string, stack: string) => {
          TemplateCompiler.stacks.set(
            stack,
            TemplateCompiler.stacks.has(stack)
              ? [...TemplateCompiler.stacks.get(stack)!, content]
              : [content],
          );
        },
      },
      {
        name: 'include',
        type: 'single',
        render: async (partial: string) => {
          if (!partial) {
            throw new Error('View partial name not provided');
          }

          const file = resolvePath(
            `${
              this.options.file && partial[0] === '.'
                ? `${this.options.file}/..`
                : 'views'
            }/${partial}.atom.html`,
          );

          try {
            const compiler = inject(TemplateCompiler);

            const compiledPartial = await compiler.render(
              await Deno.readTextFile(file),
              this.variables,
              { file, recursiveCall: true, request: this.options.request },
            );

            this.rawContent = new Map([
              ...compiler.rawContent,
              ...this.rawContent,
            ]);

            return compiledPartial;
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
              throw error;
            }

            throw new Error(
              `View partial '${partial.split('/').pop()}' does not exist`,
            );
          }
        },
      },
      {
        name: 'layout',
        type: 'single',
        render: (layout: string) => {
          const file = resolvePath(
            `${
              this.options.file && layout[0] === '.'
                ? `${this.options.file}/..`
                : 'views'
            }/${layout}.atom.html`,
          );

          if (this.layoutFile && this.layoutFile !== file) {
            throw new Error('Cannot use multiple layouts in one view');
          }

          this.layout = layout;
          this.layoutFile = file;
        },
      },
      {
        name: 'section',
        type: 'block',
        render: (content: string, name: string) => {
          this.layoutSections.set(name, content);
        },
      },
      {
        name: 'stack',
        type: 'single',
        render: (stackName: string) => {
          const stackedContent = TemplateCompiler.stacks.get(stackName) ?? [];

          return stackedContent.join('');
        },
      },
    ];
  }

  private async renderNatively<TValue>(
    code: string,
    variables: Record<string, unknown> = {},
  ): Promise<TValue> {
    const errorMessages =
      await this.options.request?.flashed<Record<string, string[]>>(
        '$errors',
      ) ?? {};

    const input = await this.options.request?.flashed<Record<string, string[]>>(
      '$input',
    ) ?? {};

    const normalizedConstants = Object.keys(constants).reduce(
      (result, key) => ({
        ...result,
        [`$${key}`]: constants[key as keyof typeof constants],
      }),
      {},
    );

    const translationCallback = (text: string, quantity = 1) => {
      return this.options.request?.translate(text, quantity) ?? text;
    };

    const globalVariables = {
      __: translationCallback,
      $errors: errorMessages,
      $input: input,
      $request: this.options.request,
      $session: this.options.request?.session,
      $token: await this.options.request?.session.get<string>([
        '_entropy',
        'csrf_token',
      ]),
      $translate: translationCallback,
      ...normalizedConstants,
      ...this.variables,
      ...this.functions,
    };

    const header = [
      ...Object.keys(globalVariables),
      ...Object.keys(variables),
      `return (async () => {${code}})();`,
    ];

    try {
      return await new Function(...header)(
        ...Object.values(globalVariables),
      ) as TValue;
    } catch (error) {
      throw new Error((error as Error).message, {
        ...(this.options.file && !this.layoutFile
          ? {
            cause: new Error(this.options.file),
          }
          : {}),
      });
    }
  }

  private async parseDataInterpolations(): Promise<void> {
    const matches = this.template.matchAll(
      /\{\{\s*(#|@?)(.*?)(\|\s*[\w\s|]*)?\}\}/gs,
    ) ?? [];

    for (const [wholeMatch, modifier, matchValue, pipesString] of matches) {
      if (modifier === '@') {
        this.template = this.template.replace(
          wholeMatch,
          wholeMatch.replace(/\{\{\s*@/, '{{'),
        );

        continue;
      }

      const value = matchValue.trim();

      let renderedExpression = await this.renderNatively(
        `
        let expression = typeof (${value}) === 'object'
          ? JSON.stringify(${value})
          : String(${value});

        if (expression instanceof Promise) {
          expression = await expression;
        }

        return ${modifier === '#' ? true : false}
          ? expression
          : $escape(expression);
        `,
      );

      if (pipesString) {
        const pipes = pipesString.slice(1).split('|').map((pipe) =>
          pipe.trim()
        );

        for (const pipe of pipes) {
          if (!this.pipes[pipe]) {
            throw new Error(`View pipe '${pipe}' does not exist`);
          }

          renderedExpression = this.pipes[pipe]?.(renderedExpression) ??
            renderedExpression;
        }
      }

      this.template = this.template.replace(
        wholeMatch,
        String(renderedExpression),
      );
    }
  }

  private async parseEachDirectives(): Promise<void> {
    const matches = this.template.matchAll(
      /@for\s*\((.*?)\s+(?:in|of)\s+([^\n]*)\)(.*?)@\/for/gs,
    ) ?? [];

    for (const [wholeMatch, variableName, iterableValue, block] of matches) {
      let iterable = await this.renderNatively<unknown[] | number>(
        `return ${iterableValue};`,
      );

      if (typeof iterable === 'number') {
        iterable = Utils.range(iterable);
      }

      let result = '';
      let iterator = 0;

      const [blockContent, elseContent] = block.split(/@(?:else|empty)/);

      if (!iterable || !Object.keys(iterable).length) {
        this.template = this.template.replace(
          wholeMatch,
          elseContent ?? '',
        );

        continue;
      }

      for (const [key, item] of Object.entries(iterable)) {
        if (Object.hasOwn(iterable, key)) {
          const index = JSON.parse(`"${key}"`);

          const scopeVariables = {
            [variableName]: item,
            $count: Object.keys(iterable).length,
            $even: index % 2 === 0,
            $first: index === 0,
            $index: iterator,
            $key: index,
            $last: index === Object.keys(iterable).length - 1,
            $odd: index % 2 === 1,
          };

          iterator += 1;

          const compiler = inject(TemplateCompiler);

          result += await compiler.render(
            blockContent,
            {
              ...this.variables,
              ...scopeVariables,
            },
            {
              file: this.options.file,
              request: this.options.request,
              recursiveCall: true,
            },
          );

          this.rawContent = new Map([
            ...compiler.rawContent,
            ...this.rawContent,
          ]);
        }
      }

      this.template = this.template.replace(wholeMatch, result);
    }
  }

  private removeComments(): void {
    const matches = this.template.matchAll(/\{(@?)--(.*?)--\}/gs) ??
      [];

    for (const [wholeMatch] of matches) {
      this.template = this.template.replace(wholeMatch, '');
    }
  }

  private restoreRawContent(): void {
    const matches = this.template.matchAll(/\$__raw__([\w-]+)/g) ?? [];

    for (const [wholeMatch, id] of matches) {
      this.template = this.template.replace(
        wholeMatch,
        this.rawContent.get(id)!,
      );
    }
  }

  private validateSyntax(): void {
    for (
      const directive of [
        ...TemplateCompiler.directives,
        { name: 'case' },
        { name: 'default' },
        { name: 'else' },
        { name: 'for' },
        { name: 'empty' },
        { name: 'slot' },
      ]
    ) {
      if (this.template.includes(`@${directive.name}`)) {
        throw new Error(`Invalid template @${directive.name} directive syntax`);
      }
    }
  }

  public async render(
    template: string,
    variables: Record<string, unknown> = {},
    options: TemplateCompilerOptions = { recursiveCall: false },
  ): Promise<string> {
    this.options = options;
    this.template = template.replaceAll('\r\n', '\n');
    this.variables = variables;

    if (!options.recursiveCall) {
      TemplateCompiler.stacks.clear();
    }

    for (const directive of TemplateCompiler.directives) {
      const pattern = new RegExp(
        directive.type === 'single'
          ? `@${directive.name}\s*(\\((.*?)\\))?`
          : `@${directive.name}\\s*(\\(([^\\n]*)\\))?(.*?)@\\/${directive.name}`,
        'gs',
      );

      const matches = this.template.matchAll(pattern) ?? [];

      for (const [expression, hasArguments, args, blockContent] of matches) {
        const resolvedArguments = hasArguments
          ? await this.renderNatively<unknown[]>(`return ${`[${args}]`};`)
          : [];

        const result = directive.type === 'single'
          ? directive.render.call(this, ...resolvedArguments)
          : directive.render.call(
            this,
            blockContent,
            ...resolvedArguments,
          );

        this.template = this.template.replace(
          expression,
          (result instanceof Promise ? await result : result) ?? '',
        );
      }

      if (directive.name === 'raw') {
        await this.parseEachDirectives();
      }
    }

    if (this.layout) {
      try {
        const compiler = inject(TemplateCompiler);

        let compiledLayout = await compiler.render(
          await Deno.readTextFile(this.layoutFile!),
          this.variables,
          {
            file: this.layoutFile!,
            recursiveCall: true,
            request: this.options.request,
          },
        );

        for (const [slot, content] of this.layoutSections) {
          compiledLayout = compiledLayout.replaceAll(
            `@slot('${slot}')`,
            await compiler.render(
              content,
              this.variables,
              { recursiveCall: true, request: this.options.request },
            ),
          );

          this.rawContent = new Map([
            ...compiler.rawContent,
            ...this.rawContent,
          ]);
        }

        this.template = compiledLayout;
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) {
          throw error;
        }

        throw new Error(
          `View layout '${this.layout.split('/').pop()}' does not exist`,
        );
      }
    }

    await this.parseDataInterpolations();

    this.removeComments();

    if (!options.recursiveCall) {
      this.validateSyntax();
      this.restoreRawContent();
    }

    return this.template;
  }

  public registerDirective(directive: TemplateDirective): void {
    for (const registeredDirective of TemplateCompiler.directives) {
      if (
        registeredDirective.name === directive.name &&
          registeredDirective.type === directive.type ||
        ['case', 'default', 'for', 'else', 'empty', 'slot'].includes(
          directive.name,
        )
      ) {
        throw new Error(
          `Template directive '${directive.name}' already exists`,
        );
      }
    }

    TemplateCompiler.directives.push(directive);
  }

  public registerDirectives(directives: TemplateDirective[]): void {
    for (const directive of directives) {
      this.registerDirective(directive);
    }
  }
}
