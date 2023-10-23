import { resolve as resolvePath } from 'https://deno.land/std@0.204.0/path/mod.ts';
import * as constants from '../constants.ts';
import * as pipes from '../pipes/pipes.module.ts';
import { HttpMethod } from '../http/enums/http_method.enum.ts';
import { TemplateCompilerOptions } from './interfaces/template_compiler_options.interface.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Constructor } from '../utils/interfaces/constructor.interface.ts';
import { env } from '../configurator/functions/env.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { HttpRequest } from '../http/http_request.class.ts';
import { NonSingleton } from '../injector/decorators/non_singleton.decorator.ts';
import { TemplateDirective } from './interfaces/template_directive.interface.ts';
import { url } from '../router/functions/url.function.ts';
import { Utils } from '../utils/utils.class.ts';
import { Pipe } from '../pipes/interfaces/pipe.interface.ts';

@NonSingleton()
export class TemplateCompiler {
  private compiledLayout: string | null = null;

  private readonly configurator = inject(Configurator);

  private directives: TemplateDirective[] = [];

  private readonly functions = {
    '$env': env,
    '$escape': Utils.escapeEntities,
    '$inject': inject,
    '$range': Utils.range,
    '$url': url,
  };

  private layout: string | null = null;

  private layoutFile: string | null = null;

  private layoutSections = new Map<string, string>();

  private options: TemplateCompilerOptions = {};

  private pipes: Record<string, (...args: unknown[]) => unknown> = Object
    .entries(pipes).reduce((result, [_key, pipe]) => {
      const instance = inject(pipe as Constructor<Pipe>);

      return {
        ...result,
        [instance.alias!]: instance.transform,
      };
    }, {});

  private rawContent: string[] = [];

  private request: HttpRequest | undefined = undefined;

  private stacks = new Map<string, string[]>();

  private template = '';

  private variables: Record<string, unknown> = {};

  constructor() {
    this.directives = [
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
            /@(case|default)\s*\((.*?)\)(.*?)@\/(case|default)/gsm,
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
              throw new Error('Not closed @switch directive case');
            }

            if (caseType === 'default') {
              if (defaultCaseValue) {
                throw new Error(
                  '@switch directive can only have one default case',
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

          return '';
        },
      },
      {
        name: 'csrf',
        type: 'single',
        render: async () => {
          return `<input type="hidden" name="_csrf" value="${await this
            .request
            ?.session.get<string>('@entropy/csrf_token')}">`;
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
                  result += `<style nonce="${this.request?.nonce ?? ''}">${
                    minify ? content.replaceAll(/\n|\t|(\r\n)/g, '') : content
                  }</style>`;

                  break;
                }

                case 'js': {
                  result += `<script nonce="${this.request?.nonce ?? ''}">${
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
            <script nonce="${this.request?.nonce ?? ''}">
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
        name: 'nonceProp',
        type: 'single',
        render: () => {
          return `nonce="${this.request?.nonce ?? ''}"`;
        },
      },
      {
        name: 'nonce',
        type: 'single',
        render: () => {
          return this.request?.nonce ?? '';
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
          this.stacks.set(
            stack,
            this.stacks.has(stack)
              ? [...this.stacks.get(stack)!, content]
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
              { file },
              this.request,
              true,
            );

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

          return '';
        },
      },
      {
        name: 'section',
        type: 'block',
        render: (content: string, name: string) => {
          this.layoutSections.set(name, content);

          return '';
        },
      },
      {
        name: 'stack',
        type: 'single',
        render: (stackName: string) => {
          const stackedContent = this.stacks.get(stackName) ?? [];

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
      __: (text: string, quantity = 1) => {
        return this.request?.translate(text, quantity) ?? text;
      },
      $request: this.request,
      $translate: (text: string, quantity = 1) => {
        return this.request?.translate(text, quantity) ?? text;
      },
      ...Object.keys(constants).reduce((result, key) => ({
        ...result,
        [`$${key}`]: constants[key as keyof typeof constants],
      }), {}),
      ...this.variables,
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
    const matches = this.template.matchAll(
      /\{\{\s*(#|@?)(.*?)(\|\s*[\w\s|]*)?\}\}/gsm,
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
      /@each\s*\((.*?)\s+(?:in|of)\s+([^\n]*)\)(.*?)@\/each/gsm,
    ) ?? [];

    try {
      for (const [wholeMatch, variableName, iterableValue, block] of matches) {
        let iterable = await this.renderNatively<unknown[] | number>(
          `return ${iterableValue};`,
        );

        if (typeof iterable === 'number') {
          iterable = Utils.range(iterable);
        }

        let result = '';
        let iterator = 0;

        const [blockContent, , elseContent] = block.split(/@(else|empty)/);

        if (!Object.keys(iterable).length) {
          this.template = this.template.replace(
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

            const compiler = inject(TemplateCompiler);

            result += await compiler.render(
              blockContent,
              {
                ...this.variables,
                ...scopeVariables,
              },
              {},
              this.request,
              true,
            );
          }
        }

        this.template = this.template.replace(wholeMatch, result);
      }
    } catch {
      throw new Error('Invalid @each directive syntax');
    }
  }

  private parseRawDirectives(): void {
    const matches = this.template.matchAll(/@raw\s+(.*?)@\/raw/gsm) ??
      [];

    let count = 0;

    for (const [wholeMatch, content] of matches) {
      this.template = this.template.replace(
        wholeMatch,
        `$_raw${count}`,
      );

      this.rawContent.push(content);

      count += 1;
    }
  }

  private removeComments(): void {
    const matches = this.template.matchAll(/\{\{(@?)--(.*?)--\}\}/g) ??
      [];

    for (const [wholeMatch] of matches) {
      this.template = this.template.replace(wholeMatch, '');
    }
  }

  private restoreRawContent(): void {
    const matches = this.template.matchAll(/\$_raw([0-9]+)/g) ?? [];

    for (const [wholeMatch, segmentIndex] of matches) {
      const index = parseInt(segmentIndex);

      this.template = this.template.replace(
        wholeMatch,
        this.rawContent[index],
      );
    }
  }

  private validateSyntax(): void {
    for (
      const directive of [
        ...this.directives,
        { name: 'case' },
        { name: 'default' },
        { name: 'each' },
        { name: 'else' },
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
    options: TemplateCompilerOptions = {},
    request?: HttpRequest,
    recursiveCall = false,
  ): Promise<string> {
    this.options = options;
    this.request = request;
    this.template = template.replaceAll('\r\n', '\n');
    this.variables = variables;

    this.parseRawDirectives();
    this.removeComments();

    await this.parseEachDirectives();

    for (const directive of this.directives) {
      const pattern = directive.type === 'single'
        ? new RegExp(`@${directive.name}\s*(\\((.*?)\\))?`, 'g')
        : new RegExp(
          `@${directive.name}\\s*(\\(([^\\n]*)\\))?(.*?)@\\/${directive.name}`,
          'gsm',
        );

      const matches = this.template.matchAll(directive.pattern ?? pattern) ??
        [];

      for (const [expression, hasArguments, args, blockContent] of matches) {
        const resolvedArguments = hasArguments
          ? await this.renderNatively<unknown[]>(`return ${`[${args}]`};`)
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

    if (this.layout) {
      try {
        const compiler = inject(TemplateCompiler);

        let compiledLayout = await compiler.render(
          await Deno.readTextFile(this.layoutFile!),
          this.variables,
          { file: this.layoutFile! },
          this.request,
          true,
        );

        for (const [slot, content] of this.layoutSections) {
          compiledLayout = compiledLayout.replaceAll(
            `@slot('${slot}')`,
            await compiler.render(
              content,
              this.variables,
              {},
              this.request,
              true,
            ),
          );
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

    this.restoreRawContent();

    if (!recursiveCall) {
      this.validateSyntax();
    }

    return this.template;
  }

  public registerDirective(directive: TemplateDirective): void {
    for (const registeredDirective of this.directives) {
      if (
        registeredDirective.name === directive.name ||
        ['case', 'default', 'each', 'else', 'empty', 'slot'].includes(
          directive.name,
        )
      ) {
        throw new Error(
          `Template directive '${directive.name}' already exists`,
        );
      }
    }

    this.directives.push(directive);
  }

  public registerDirectives(directives: TemplateDirective[]): void {
    for (const directive of directives) {
      this.registerDirective(directive);
    }
  }
}
