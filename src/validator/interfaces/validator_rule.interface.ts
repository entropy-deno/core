import { FalsyValue } from '../../utils/types/falsy_value.type.ts';
import { TruthyValue } from '../../utils/types/truthy_value.type.ts';

export interface ValidatorRule {
  name: string;
  errorMessage: string;
  validate: (
    input: [string | null, ...unknown[]],
    fieldName: string,
  ) => FalsyValue | TruthyValue | Promise<FalsyValue | TruthyValue>;
}
