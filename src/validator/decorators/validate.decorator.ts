import { MethodDecorator } from '../../utils/types/method_decorator.type.ts';
import { Reflector } from '../../utils/reflector.class.ts';
import { ValidatorRulesList } from '../interfaces/validator_rules_list.interface.ts';

export function Validate(
  rules: Record<string, Partial<ValidatorRulesList> | Record<string, unknown>>,
): MethodDecorator {
  return (originalMethod) => {
    Reflector.defineMetadata<typeof rules>(
      'assert',
      rules,
      originalMethod,
    );

    return originalMethod;
  };
}
