import { existsSync } from '@std/fs/mod.ts';
import * as constants from '../constants.ts';
import { CompileOptions } from './interfaces/compile_options.interface.ts';
import { env } from '../utils/functions/env.function.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { range } from '../utils/functions/range.function.ts';
import {
  TemplateDirectiveDefinition,
} from './interfaces/template_directive_definition.interface.ts';

export class TemplateCompiler {
  private data: Record<string, unknown> = {};

  private directives: TemplateDirectiveDefinition[] = [];

  private html = '';

  private readonly functions = {
    env,
    inject,
    range,
  };

  private options: CompileOptions = {};

  private rawContent: string[] = [];

  public static stacks = new Map<string, string[]>();

  constructor() {
    this.directives = [
      {
        name: 'dev',
        type: 'block',
        render: (content: string) => {
          const isDevelopment = env<boolean>('DEVELOPMENT');

          return isDevelopment ? content : '';
        },
      },
      {
        name: 'inline',
        type: 'single',
        render: async (files: string | string[], minify = false) => {
          if (!Array.isArray(files)) {
            files = [files];
          }

          let result = '';

          await Promise.all(
            files.map(async (file) => {
              if (!file.endsWith('.js') && !file.endsWith('.css')) {
                throw new Error(
                  `Unsupported file extension '.${
                    file
                      .split('.')
                      .pop()
                  }' for inlined file`,
                );
              }

              const path = `public/${file}`;

              if (!existsSync(path)) {
                throw new Error(
                  `File '${file}' not found`,
                );
              }

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
            }),
          );

          return result;
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
          const isDevelopment = env<boolean>('DEVELOPMENT');

          return isDevelopment ? '' : content;
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

          if (!existsSync(file)) {
            throw new Error(
              `View partial '${partial}' does not exist`,
            );
          }

          const compiler = inject(TemplateCompiler, {
            fresh: true,
          });

          const fileContent = await Deno.readTextFile(file);
          const compiledPartial = await compiler.compile(fileContent, this.data);

          return compiledPartial;
        },
      },
      {
        name: 'use',
        type: 'block',
        render: async (layout: string) => {
          const file = `${
            this.options.file ? `${this.options.file}/..` : 'app/views'
          }/${layout}.html`;

          if (!existsSync(file)) {
            throw new Error(
              `View layout '${layout}' does not exist`,
            );
          }

          const compiler = inject(TemplateCompiler, {
            fresh: true,
          });

          const fileContent = await Deno.readTextFile(file);
          const compiledLayout = await compiler.compile(fileContent, this.data);

          return compiledLayout;
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
      ...constants,
      ...this.data,
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
    const matches = this.html.matchAll(/\{\{(#|@?)(.*?)\}\}/g) ?? [];

    for (const [wholeMatch, modifier, matchValue] of matches) {
      if (modifier === '@') {
        continue;
      }

      const value = matchValue.trim();
      const renderExpression = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      const escapedRenderExpression = renderExpression.replace(
        /[&<>'"]/g,
        (char) => {
          const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;',
          };

          return entities[char as '&' | '<' | '>' | '"' | `'`];
        },
      );

      const renderFunction = this.getRenderFunction(
        `return ${modifier === '#' ? true : false}
          ? '${renderExpression}'
          : '${escapedRenderExpression}';`,
      );

      const renderedExpression = renderFunction();

      this.html = this.html.replace(wholeMatch, String(renderedExpression));
    }
  }

  private async parseEachDirectives(): Promise<void> {
    const matches = this.html.matchAll(
      /\[each *?\((.*?) (in|of) (.*)\)\](\n|\r\n)?((.*?|\s*?)*?)\[\/each\]/gm,
    ) ?? [];

    for (const match of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${match[3]};`,
      );

      const variableName = match[1];

      let iterable = renderFunction<unknown[]>();
      let result = '';
      let iterator = 0;

      if (typeof iterable === 'number') {
        iterable = range(iterable);
      }

      await Promise.all(
        Object.entries(iterable).map(async ([key, item]) => {
          if (Object.hasOwn(iterable, key)) {
            const index = JSON.parse(`"${key}"`);

            let content = match[5];

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

            content = await compiler.compile(content, {
              ...this.data,
              ...scopeVariables,
            });

            result += content;
          }
        }),
      );

      this.html = this.html.replace(match[0], result);
    }
  }

  private parseIfDirectives(): void {
    const matches =
      this.html.matchAll(/\[if ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/if\]/gm) ?? [];

    for (const match of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${match[3]};`,
      );

      const condition = renderFunction<boolean>();

      if (condition) {
        this.html = this.html.replace(match[0], match[3]);

        continue;
      }

      this.html = this.html.replace(match[0], '');
    }
  }

  private parseIfElseDirectives(): void {
    const matches = this.html.matchAll(
      /\[if ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)(\[else\])((.|\n|\r\n)*?)\[\/if\]/gm,
    ) ?? [];

    for (const match of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${match[3]};`,
      );

      const condition = renderFunction<boolean>();

      if (condition) {
        this.html = this.html.replace(match[0], match[3]);

        continue;
      }

      this.html = this.html.replace(match[0], match[6]);
    }
  }

  private parseRawDirectives(): void {
    const matches =
      this.html.matchAll(/\[raw\](\n|\r\n)?((.*?|\s*?)*?)\[\/raw\]/gm) ?? [];

    let count = 0;

    for (const match of matches) {
      this.html = this.html.replace(match[0], `$_raw${count}`);

      this.rawContent.push(match[2]);

      count += 1;
    }
  }

  private parseSwitchDirectives(): void {
    const matches = this.html.matchAll(
      /\[switch ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/switch\]/gm,
    ) ?? [];

    for (const match of matches) {
      const renderFunction = this.getRenderFunction(
        `return ${match[3]};`,
      );
      const switchCondition = renderFunction<unknown>();

      const casesString = match[3];
      const cases = new Map<unknown, string>();

      let defaultCaseValue: string | null = null;

      const caseMatches = casesString.matchAll(
        /\[(case|default) ?(.*?)\](\n|\r\n*?)?((.|\n|\r\n)*?)\[\/(case|default)\]/gm,
      );

      for (const caseMatch of caseMatches) {
        if (caseMatch[1] === 'default') {
          if (defaultCaseValue) {
            throw new Error(
              'Switch directive can only have one default case',
            );
          }

          defaultCaseValue = caseMatch[4];

          continue;
        }

        const caseRenderFunction = this.getRenderFunction(
          `return ${caseMatch[2]};`,
        );

        cases.set(caseRenderFunction<unknown>(), caseMatch[4]);
      }

      let matchesOneCase = false;

      cases.forEach((value, key) => {
        if (key === switchCondition) {
          this.html = this.html.replace(match[0], value);

          matchesOneCase = true;

          return;
        }
      });

      if (!matchesOneCase && defaultCaseValue) {
        this.html = this.html.replace(match[0], defaultCaseValue);

        return;
      }

      this.html = this.html.replace(match[0], '');
    }
  }

  private removeComments(): void {
    const matches = this.html.matchAll(/\{\{(@?)--(.*?)--\}\}/g) ?? [];

    for (const match of matches) {
      this.html = this.html.replace(match[0], '');
    }
  }

  private restoreRawContent(): void {
    const matches = this.html.matchAll(/\$_raw([0-9]+)/g) ?? [];

    for (const match of matches) {
      const index = parseInt(match[1]);

      this.html = this.html.replace(match[0], this.rawContent[index]);
    }
  }

  public async compile(
    html: string,
    data: Record<string, unknown> = {},
    options: CompileOptions = {},
  ): Promise<string> {
    this.data = data;
    this.html = html;
    this.options = options;
    this.rawContent = [];

    this.parseRawDirectives();
    this.removeComments();

    await this.parseEachDirectives();

    this.parseIfElseDirectives();
    this.parseIfDirectives();
    this.parseDataInterpolations();
    this.parseSwitchDirectives();

    await Promise.all(
      this.directives.map(async (directive) => {
        const pattern = directive.type === 'single'
          ? new RegExp(`\\[${directive.name} *?(\\((.*?)\\))?\\]`, 'g')
          : new RegExp(
            `\\[${directive.name} *?(\\((.*?)\\))?\\](\n|\r\n*?)?((.|\n|\r\n)*?)\\[\\/${directive.name}\\]`,
            'gm',
          );

        const matches = this.html.matchAll(directive.pattern ?? pattern) ?? [];

        enum SegmentIndexes {
          Expression = 0,
          Arguments = 2,
          BlockContent = 4,
        }

        for (const match of matches) {
          const hasArguments = match[1];

          const argumentsRenderFunction = hasArguments
            ? this.getRenderFunction(
              `return ${`[${match[SegmentIndexes.Arguments]}]`};`,
            )
            : () => [];

          const resolvedArguments = hasArguments
            ? argumentsRenderFunction<unknown[]>()
            : [];

          const result = directive.type === 'single'
            ? directive.render(...resolvedArguments)
            : directive.render(
              match[SegmentIndexes.BlockContent],
              ...resolvedArguments,
            );

          this.html = this.html.replace(
            match[SegmentIndexes.Expression],
            result instanceof Promise ? await result : result,
          );
        }
      }),
    );

    this.restoreRawContent();

    return this.html;
  }

  public registerDirective(directive: TemplateDirectiveDefinition): void {
    this.directives.push(directive);
  }
}
