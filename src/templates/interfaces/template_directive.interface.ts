export interface TemplateDirective {
  name: string;
  type: 'block' | 'single';
  pattern?: RegExp;
  // deno-lint-ignore no-explicit-any
  render: (...args: any[]) => string | Promise<string>;
}
