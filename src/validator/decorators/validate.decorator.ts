import { Reflector } from '../../utils/reflector.class.ts';
import { ValidationRulesList } from '../interfaces/validation_rules_list.interface.ts';

export function Validate(
  rules: Record<string, Partial<ValidationRulesList> | Record<string, unknown>>,
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<typeof rules>(
      'validationRules',
      rules,
      descriptor.value as ((...args: unknown[]) => unknown),
    );

    return descriptor;
  };
}
