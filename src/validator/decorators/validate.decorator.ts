import { Reflector } from '../../utils/reflector.class.ts';
import { ValidationRules } from '../interfaces/validation_rules.interface.ts';

export function Validate(
  rules: Record<string, ValidationRules | Record<string, unknown>>,
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
