import { Reflector } from '../../utils/reflector.class.ts';
import { ValidatorRulesList } from '../interfaces/validator_rules_list.interface.ts';

export function Validate(
  rules: Record<string, Partial<ValidatorRulesList> | Record<string, unknown>>,
): MethodDecorator {
  return (_target, _methodName, descriptor) => {
    Reflector.defineMetadata<typeof rules>(
      'ValidatorRules',
      rules,
      descriptor.value as object,
    );

    return descriptor;
  };
}
