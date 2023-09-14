import { AnyFunction } from '../../utils/types/any_function.type.ts';

export interface TemplateDirective {
  name: string;
  type: 'block' | 'single';
  pattern?: RegExp;
  render: AnyFunction<string | Promise<string>>;
}
