import { AnyFunction } from '../../utils/types/any_function.type.ts';

export interface TemplateDirective {
  name: string;
  type: 'block' | 'single';
  render: AnyFunction<string | void | Promise<string | void>>;
}
