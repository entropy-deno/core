import * as constants from '../constants.ts';
import { CompileOptions } from './interfaces/compile_options.interface.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { env } from '../utils/functions/env.function.ts';
import { escape } from '../utils/functions/escape.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { range } from '../utils/functions/range.function.ts';
import {
  TemplateDirectiveDefinition,
} from './interfaces/template_directive_definition.interface.ts';
import { translate } from '../localizator/functions/translate.function.ts';

export class TemplateCompiler {
  private readonly configurator = inject(Configurator);

  private directives: TemplateDirectiveDefinition[] = [];

  private readonly functions = {
    '__': translate,
    '$': translate,
    '$env': env,
    '$escape': escape,
    '$inject': inject,
    '$range': range,
    '$translate': translate,
  };

  private options: CompileOptions = {};

  private rawContent: string[] = [];

  private request: Request | undefined = undefined;

  private template = '';

  private variables: Record<string, unknown> = {};

  public static stacks = new Map<string, string[]>();

  constructor() {
    this.directives = [
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
          if (!Array.isArray(files)) {
            files = [files];
          }

          let result = '';

          for (const file of files) {
            if (!file.endsWith('.js') && !file.endsWith('.css')) {
              throw new Error(
                `Unsupported file extension '.${
                  file
                    .split('.')
                    .pop()
                }' for embedded file`,
              );
            }

            const path = `public/${file}`;

            try {
              const content = await Deno.readTextFile(path);

              switch (file.split('.').pop()) {
                case 'js':
                  result += `<script>${
                    minify ? content.replaceAll(/[\n\r\n\t]/g, '') : content
                  }</script>`;

                  break;

                case 'css':
                  result += `<style>${
                    minify ? content.replaceAll(/[\n\r\n\t]/g, '') : content
                  }</style>`;

                  break;
              }
            } catch (error) {
              if (!(error instanceof Deno.errors.NotFound)) {
                throw error;
              }

              throw new Error(
                `File for embedding '${file}' does not exist`,
              );
            }
          }

          return result;
        },
      },
      {
        name: 'hotReload',
        type: 'single',
        render: () => {
          return this.configurator.entries.isProduction ? '' : `
            <script>
              const ws = new WebSocket('ws://${this.configurator.entries.host}:${this.configurator.entries.wsPort}');

              ws.onmessage = () => {
                window.location.reload();
              };

              ws.onclose = () => console.log('[entropy] Hot reload disconnected');
            </script>
          `;
        },
      },
      {
        name: 'json',
        type: 'single',
        render: (data: unknown, prettyPrint = false) => {
          return JSON.stringify(data, undefined, prettyPrint ? 2 : 0);
        },
      },
      {
        name: 'method',
        type: 'single',
        render: (method: string) => {
          method = method.toUpperCase();

          return `<input type="hidden" name="_method" value="${method}">`;
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
          const { stacks } = this.constructor as unknown as {
            stacks: Map<string, string[]>;
          };

          stacks.set(
            stack,
            stacks.has(stack) ? [...stacks.get(stack)!, content] : [content],
          );

          return '';
        },
      },
      {
        name: 'include',
        type: 'single',
        render: async (partial: string) => {
          const file = `${
            this.options.file ? `${this.options.file}/..` : 'app/views'
          }/${partial}.html`;

          try {
            const compiler = inject(TemplateCompiler, {
              fresh: true,
            });

            const fileContent = await Deno.readTextFile(file);
            const compiledPartial = await compiler.compile(
              fileContent,
              this.variables,
              {},
              this.request,
            );

            return compiledPartial;
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
              throw error;
            }

            throw new Error(
              `View partial '${partial}' does not exist`,
            );
          }
        },
      },
      {
        name: 'use',
        type: 'block',
        render: async (layout: string) => {
          const file = `${
            this.options.file ? `${this.options.file}/..` : 'app/views'
          }/${layout}.html`;

          try {
            const compiler = inject(TemplateCompiler, {
              fresh: true,
            });

            const fileContent = await Deno.readTextFile(file);
            const compiledLayout = await compiler.compile(
              fileContent,
              this.variables,
              {},
              this.request,
            );

            return compiledLayout;
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) {
              throw error;
            }

            throw new Error(
              `View layout '${layout}' does not exist`,
            );
          }
        },
      },
      {
        name: 'stack',
        type: 'single',
        render: (stackName: string) => {
          const { stacks } = this.constructor as unknown as {
            stacks: Map<string, string[]>;
          };

          const stackedContent = stacks.get(stackName) ?? [];

          return stackedContent.join('');
        },
      },
    ];
  }

  private getRenderFunction(body: string, variables: Record<string, unknown> = {}) {
    const globalVariables = {
      $request: this.request,
      ...Object.keys(constants).reduce((result, key) => ({
        ...result,
        [`$${key}`]: (constants as Record<string, unknown>)[key],
      }), {}),
      ...this.variables,
      ...this.functions,
    };

    const header = [
      ...Object.keys(globalVariables),
      ...Object.keys(variables),
      body,
    ];

    return <T>(...args: unknown[]): T => {
      return new Function(...header)(
        ...Object.values(globalVariables),
        ...args,
      ) as T;
    };
  }

  private parseDataInterpolations(): void {
    const matches = this.template.matchAll(/\{\{(#|@?)(.*?)\}\}/g) ?? [];

    for (const [wholeMatch, modifier, matchValue] of matches) {
      if (modifier === '@') {
        continue;
      }

      const value = matchValue.trim();

      const renderFunction = this.getRenderFunction(
        `
        const expression = typeof ${value} === 'object'
          ? JSON.stringify(${value})
          : String(${value});

        return ${modifier === '#' ? true : false}
          ? expression
          : $escape(expression);
        `,
      );

      const renderedExpression = renderFunction();

      this.template = this.template.replace(wholeMatch, String(renderedExpression));
    }
  }

  private async parseEachDirectives(): Promise<void> {
    const matches = this.template.matchAll(
      /\[each *?\((.*?) (in|of) (.*)\)\](\n|\r\n)?((.*?|\s*?)*?)\[\/each\]/gm,
    ) ?? [];

    for (const [wholeMatch, variableName, , iterableValue, , block] of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${iterableValue};`,
      );

      let iterable = renderFunction<unknown[]>();
      let result = '';
      let iterator = 0;

      if (typeof iterable === 'number') {
        iterable = range(iterable);
      }

      for (const [key, item] of Object.entries(iterable)) {
        if (Object.hasOwn(iterable, key)) {
          const index = JSON.parse(`"${key}"`);

          let content = block;

          const scopeVariables = {
            [variableName]: item,
            $even: index % 2 === 0,
            $first: index === 0,
            $index: iterator,
            $key: index,
            $last: index === Object.keys(iterable).length - 1,
            $odd: index % 2 === 1,
          };

          iterator += 1;

          const compiler = inject(TemplateCompiler, {
            fresh: true,
          });

          content = await compiler.compile(
            content,
            {
              ...this.variables,
              ...scopeVariables,
            },
            {},
            this.request,
          );

          result += content;
        }
      }

      this.template = this.template.replace(wholeMatch, result);
    }
  }

  private parseIfDirectives(): void {
    const matches =
      this.template.matchAll(/\[if ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/if\]/gm) ??
        [];

    for (const [wholeMatch, , , content] of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${content};`,
      );

      const condition = renderFunction<boolean>();

      if (condition) {
        this.template = this.template.replace(wholeMatch, content);

        continue;
      }

      this.template = this.template.replace(wholeMatch, '');
    }
  }

  private parseIfElseDirectives(): void {
    const matches = this.template.matchAll(
      /\[if ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)(\[else\])((.|\n|\r\n)*?)\[\/if\]/gm,
    ) ?? [];

    for (const [wholeMatch, , , value, , , content] of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${value};`,
      );

      const condition = renderFunction<boolean>();

      if (condition) {
        this.template = this.template.replace(wholeMatch, value);

        continue;
      }

      this.template = this.template.replace(wholeMatch, content);
    }
  }

  private parseRawDirectives(): void {
    const matches =
      this.template.matchAll(/\[raw\](\n|\r\n)?((.*?|\s*?)*?)\[\/raw\]/gm) ?? [];

    let count = 0;

    for (const [wholeMatch, , content] of matches) {
      this.template = this.template.replace(wholeMatch, `$_raw${count}`);

      this.rawContent.push(content);

      count += 1;
    }
  }

  private parseSwitchDirectives(): void {
    const matches = this.template.matchAll(
      /\[switch ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/switch\]/gm,
    ) ?? [];

    for (const [wholeMatch, , , casesString] of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${casesString};`,
      );
      const switchCondition = renderFunction<unknown>();

      const cases = new Map<unknown, string>();

      let defaultCaseValue: string | null = null;

      const caseMatches = casesString.matchAll(
        /\[(case|default) ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/(case|default)\]/gm,
      );

      for (const [, caseType, caseValue, , caseContent] of caseMatches) {
        if (caseType === 'default') {
          if (defaultCaseValue) {
            throw new Error(
              'Switch directive can only have one default case',
            );
          }

          defaultCaseValue = caseContent;

          continue;
        }

        const caseRenderFunction = this.getRenderFunction(
          `return ${caseValue};`,
        );

        cases.set(caseRenderFunction<unknown>(), caseContent);
      }

      let matchesOneCase = false;

      for (const [key, value] of cases) {
        if (key === switchCondition) {
          this.template = this.template.replace(wholeMatch, value);

          matchesOneCase = true;

          break;
        }
      }

      if (!matchesOneCase && defaultCaseValue) {
        this.template = this.template.replace(wholeMatch, defaultCaseValue);

        return;
      }

      this.template = this.template.replace(wholeMatch, '');
    }
  }

  private removeComments(): void {
    const matches = this.template.matchAll(/\{\{(@?)--(.*?)--\}\}/g) ?? [];

    for (const [wholeMatch] of matches) {
      this.template = this.template.replace(wholeMatch, '');
    }
  }

  private restoreRawContent(): void {
    const matches = this.template.matchAll(/\$_raw([0-9]+)/g) ?? [];

    for (const [wholeMatch, segmentIndex] of matches) {
      const index = parseInt(segmentIndex);

      this.template = this.template.replace(wholeMatch, this.rawContent[index]);
    }
  }

  public async compile(
    template: string,
    variables: Record<string, unknown> = {},
    options: CompileOptions = {},
    request?: Request,
  ): Promise<string> {
    this.options = options;
    this.rawContent = [];
    this.request = request;
    this.template = template;
    this.variables = variables;

    this.parseRawDirectives();
    this.removeComments();

    await this.parseEachDirectives();

    this.parseIfElseDirectives();
    this.parseIfDirectives();
    this.parseDataInterpolations();
    this.parseSwitchDirectives();

    for (const directive of this.directives) {
      const pattern = directive.type === 'single'
        ? new RegExp(`\\[${directive.name} *?(\\((.*?)\\))?\\]`, 'g')
        : new RegExp(
          `\\[${directive.name} *?(\\((.*?)\\))?\\](\n|\r\n*?)?((.|\n|\r\n)*?)\\[\\/${directive.name}\\]`,
          'gm',
        );

      const matches = this.template.matchAll(directive.pattern ?? pattern) ?? [];

      for (const [expression, hasArguments, args, , blockContent] of matches) {
        const argumentsRenderFunction = hasArguments
          ? this.getRenderFunction(
            `return ${`[${args}]`};`,
          )
          : () => [];

        const resolvedArguments = hasArguments
          ? argumentsRenderFunction<unknown[]>()
          : [];

        const result = directive.type === 'single'
          ? directive.render(...resolvedArguments)
          : directive.render(
            blockContent,
            ...resolvedArguments,
          );

        this.template = this.template.replace(
          expression,
          result instanceof Promise ? await result : result,
        );
      }
    }

    this.restoreRawContent();

    return this.template;
  }

  public registerDirective(directive: TemplateDirectiveDefinition): void {
    this.directives.push(directive);
  }
}
