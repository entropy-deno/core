import { resolve as resolvePath } from 'https://deno.land/std@0.203.0/path/mod.ts';
import * as constants from '../constants.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { TemplateCompilerOptions } from './interfaces/template_compiler_options.interface.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { env } from '../configurator/functions/env.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { TemplateDirective } from './interfaces/template_directive.interface.ts';
import { Utils } from '../utils/utils.class.ts';

export class TemplateCompiler {
  private readonly configurator = inject(Configurator);

  private directives: TemplateDirective[] = [];

  private readonly functions = {
    '$env': env,
    '$escape': Utils.escape,
    '$inject': inject,
    '$range': Utils.range,
  };

  private currentRawContent: string[] = [];

  private currentRequest: HttpRequest | undefined = undefined;

  private currentStacks = new Map<string, string[]>();

  private currentTemplate = '';

  private currentVariables: Record<string, unknown> = {};

  public currentOptions: TemplateCompilerOptions = {};

  constructor() {
    this.directives = [
      {
        name: 'csrf',
        type: 'single',
        render: () => {
          return `<input type="hidden" name="_csrf" value="${
            this.currentRequest
              ?.session.get<string>('@entropy/csrf_token')
          }">`;
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

            const path = `public/${file}`;

            try {
              const content = await Deno.readTextFile(path);

              switch (file.split('.').pop()) {
                case 'css': {
                  result += `<style nonce="${
                    this.currentRequest?.nonce ?? ''
                  }">${
                    minify ? content.replaceAll(/\n|\t|(\r\n)/g, '') : content
                  }</style>`;

                  break;
                }

                case 'js': {
                  result += `<script nonce="${
                    this.currentRequest?.nonce ?? ''
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
            <script nonce="${this.currentRequest?.nonce ?? ''}">
              const ws = new WebSocket('${
            this.configurator.entries.tls.enabled ? 'wss' : 'ws'
          }://${this.configurator.entries.host}:${this.configurator.entries.port}');

              ws.onmessage = (event) => {
                if (JSON.parse(event.data).channel === '@entropy/hot-reload') {
                  window.location.reload();
                }
              };

              ws.onclose = () => console.error('[entropy] Hot reload disconnected');
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
        name: 'nonce',
        type: 'single',
        render: () => {
          return this.currentRequest?.nonce ?? '';
        },
      },
      {
        name: 'nonceProp',
        type: 'single',
        render: () => {
          return `nonce="${this.currentRequest?.nonce ?? ''}"`;
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
          this.currentStacks.set(
            stack,
            this.currentStacks.has(stack)
              ? [...this.currentStacks.get(stack)!, content]
              : [content],
          );

          return '';
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
              this.currentOptions.file && partial[0] === '.'
                ? `${this.currentOptions.file}/..`
                : 'views'
            }/${partial}.html`,
          );

          try {
            const compiler = inject(TemplateCompiler, {
              singleton: false,
            });

            compiler.currentOptions.file = file;

            const compiledPartial = await compiler.$compile(
              await Deno.readTextFile(file),
              this.currentVariables,
              {},
              this.currentRequest,
            );

            return compiledPartial;
          } catch {
            throw new Error(
              `View partial '${partial}' does not exist`,
            );
          }
        },
      },
      {
        name: 'layout',
        type: 'block',
        render: async (content: string, layout: string) => {
          if (!layout) {
            throw new Error('View layout name not provided');
          }

          const file = resolvePath(
            `${
              this.currentOptions.file && layout[0] === '.'
                ? `${this.currentOptions.file}/..`
                : 'views'
            }/${layout}.html`,
          );

          try {
            const compiler = inject(TemplateCompiler, {
              singleton: false,
            });

            compiler.currentOptions.file = file;

            const compiledLayout = await compiler.$compile(
              await Deno.readTextFile(file),
              this.currentVariables,
              {},
              this.currentRequest,
            );

            return compiledLayout.replaceAll('[slot]', content);
          } catch {
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
          const stackedContent = this.currentStacks.get(stackName) ?? [];

          return stackedContent.join('');
        },
      },
    ];
  }

  private async renderNatively<TValue>(
    code: string,
    variables: Record<string, unknown> = {},
  ): Promise<TValue> {
    const globalData = {
      __: (text: string, quantity = 1) =>
        this.currentRequest?.translate(text, quantity) ?? text,
      $request: this.currentRequest,
      $translate: (text: string, quantity = 1) =>
        this.currentRequest?.translate(text, quantity) ?? text,
      ...Object.keys(constants).reduce((result, key) => ({
        ...result,
        [`$${key}`]: constants[key as keyof typeof constants],
      }), {}),
      ...this.currentVariables,
      ...this.functions,
    };

    const header = [
      ...Object.keys(globalData),
      ...Object.keys(variables),
      `return (async () => {${code}})();`,
    ];

    return await new Function(...header)(
      ...Object.values(globalData),
    ) as TValue;
  }

  private async parseDataInterpolations(): Promise<void> {
    const matches =
      this.currentTemplate.matchAll(/\{\{(#|@?)((.|\s)*?)\}\}/gm) ?? [];

    for (const [wholeMatch, modifier, matchValue] of matches) {
      if (modifier === '@') {
        continue;
      }

      const value = matchValue.trim();

      const renderedExpression = await this.renderNatively(
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

      this.currentTemplate = this.currentTemplate.replace(
        wholeMatch,
        String(renderedExpression),
      );
    }
  }

  private async parseEachDirectives(): Promise<void> {
    const matches = this.currentTemplate.matchAll(
      /\[each *?\((.*?) (in|of) (.*)\)\](\n|\r\n)?((.*?|\s*?)*?)\[\/each\]/gm,
    ) ?? [];

    for (
      const [wholeMatch, variableName, , iterableValue, , block] of matches
    ) {
      let iterable = await this.renderNatively<unknown[] | number>(
        `return ${iterableValue};`,
      );

      if (typeof iterable === 'number') {
        iterable = Utils.range(iterable);
      }

      let result = '';
      let iterator = 0;

      const [blockContent, , elseContent] = block.split(/\[(else|empty)\]/);

      if (!Object.keys(iterable).length) {
        this.currentTemplate = this.currentTemplate.replace(
          wholeMatch,
          elseContent ?? '',
        );
      }

      for (const [key, item] of Object.entries(iterable)) {
        if (Object.hasOwn(iterable, key)) {
          const index = JSON.parse(`"${key}"`);

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
            singleton: false,
          });

          result += await compiler.$compile(
            blockContent,
            {
              ...this.currentVariables,
              ...scopeVariables,
            },
            {},
            this.currentRequest,
          );
        }
      }

      this.currentTemplate = this.currentTemplate.replace(wholeMatch, result);
    }
  }

  private async parseIfDirectives(): Promise<void> {
    const matches = this.currentTemplate.matchAll(
      /\[if ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/if\]/gm,
    ) ??
      [];

    for (const [wholeMatch, conditionString, , content] of matches) {
      const condition = await this.renderNatively(
        `return ${conditionString};`,
      );

      const [ifContent, elseContent] = content.split('[else]');

      if (condition) {
        this.currentTemplate = this.currentTemplate.replace(
          wholeMatch,
          ifContent,
        );

        continue;
      }

      this.currentTemplate = this.currentTemplate.replace(
        wholeMatch,
        elseContent ?? '',
      );
    }
  }

  private parseRawDirectives(): void {
    const matches = this.currentTemplate.matchAll(
      /\[raw\](\n|\r\n)?((.*?|\s*?)*?)\[\/raw\]/gm,
    ) ??
      [];

    let count = 0;

    for (const [wholeMatch, , content] of matches) {
      this.currentTemplate = this.currentTemplate.replace(
        wholeMatch,
        `$_raw${count}`,
      );

      this.currentRawContent.push(content);

      count += 1;
    }
  }

  private async parseSwitchDirectives(): Promise<void> {
    const matches = this.currentTemplate.matchAll(
      /\[switch ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/switch\]/gm,
    ) ?? [];

    for (const [wholeMatch, conditionString, , casesString] of matches) {
      const condition = await this.renderNatively(
        `return ${conditionString};`,
      );

      const cases = new Map<unknown, string>();

      let defaultCaseValue: string | null = null;

      const caseMatches = casesString.matchAll(
        /\[(case|default) ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/(case|default)\]/gm,
      );

      for (
        const [, caseType, caseConditionString, , caseContent] of caseMatches
      ) {
        if (caseType === 'default') {
          if (defaultCaseValue) {
            throw new Error(
              '[switch] directive can only have one default case',
            );
          }

          defaultCaseValue = caseContent;

          continue;
        }

        const caseRegex = /\[case ?(.*?)\]/g;
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

      let matchesOneCase = false;

      for (const [key, value] of cases) {
        if (key === condition) {
          this.currentTemplate = this.currentTemplate.replace(
            wholeMatch,
            value,
          );

          matchesOneCase = true;

          break;
        }
      }

      if (!matchesOneCase && defaultCaseValue) {
        this.currentTemplate = this.currentTemplate.replace(
          wholeMatch,
          defaultCaseValue,
        );

        return;
      }

      this.currentTemplate = this.currentTemplate.replace(wholeMatch, '');
    }
  }

  private removeComments(): void {
    const matches = this.currentTemplate.matchAll(/\{\{(@?)--(.*?)--\}\}/g) ??
      [];

    for (const [wholeMatch] of matches) {
      this.currentTemplate = this.currentTemplate.replace(wholeMatch, '');
    }
  }

  private restoreRawContent(): void {
    const matches = this.currentTemplate.matchAll(/\$_raw([0-9]+)/g) ?? [];

    for (const [wholeMatch, segmentIndex] of matches) {
      const index = parseInt(segmentIndex);

      this.currentTemplate = this.currentTemplate.replace(
        wholeMatch,
        this.currentRawContent[index],
      );
    }
  }

  public async $compile(
    template: string,
    variables: Record<string, unknown> = {},
    options: TemplateCompilerOptions = {},
    request?: HttpRequest,
  ): Promise<string> {
    this.currentOptions = options;
    this.currentRawContent = [];
    this.currentRequest = request;
    this.currentTemplate = template;
    this.currentVariables = variables;

    this.parseRawDirectives();
    this.removeComments();

    await this.parseEachDirectives();
    await this.parseIfDirectives();
    await this.parseDataInterpolations();
    await this.parseSwitchDirectives();

    for (const directive of this.directives) {
      const pattern = directive.type === 'single'
        ? new RegExp(`\\[${directive.name} *?(\\((.*?)\\))?\\]`, 'g')
        : new RegExp(
          `\\[${directive.name} *?(\\((.*?)\\))?\\](\n|\r\n*?)?((.|\n|\r\n)*?)\\[\\/${directive.name}\\]`,
          'gm',
        );

      const matches =
        this.currentTemplate.matchAll(directive.pattern ?? pattern) ??
          [];

      for (const [expression, hasArguments, args, , blockContent] of matches) {
        const resolvedArguments = hasArguments
          ? await this.renderNatively<unknown[]>(`return ${`[${args}]`};`)
          : [];

        const result = directive.type === 'single'
          ? directive.render(...resolvedArguments)
          : directive.render(
            blockContent,
            ...resolvedArguments,
          );

        this.currentTemplate = this.currentTemplate.replace(
          expression,
          result instanceof Promise ? await result : result,
        );
      }
    }

    this.restoreRawContent();

    return this.currentTemplate;
  }

  public async render(
    template: string,
    variables: Record<string, unknown> = {},
    options: TemplateCompilerOptions = {},
    request?: HttpRequest,
  ): Promise<string> {
    const compiledTemplate = await this.$compile(
      template,
      variables,
      options,
      request,
    );

    this.currentStacks.clear();

    return compiledTemplate;
  }

  public registerDirective(directive: TemplateDirective): void {
    this.directives.push(directive);
  }

  public registerDirectives(directives: TemplateDirective[]): void {
    for (const directive of directives) {
      this.registerDirective(directive);
    }
  }
}
