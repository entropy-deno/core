export interface TemplateDirectiveDefinition {
  name: string;
  type: 'single' | 'double' | 'block';
  pattern?: RegExp;
  // deno-lint-ignore no-explicit-any
  render: (...args: any[]) => string | Promise<string>;
}
