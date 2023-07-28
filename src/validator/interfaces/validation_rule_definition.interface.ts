export interface ValidationRuleDefinition {
  name: string;
  errorMessage: string;
  validate: (
    input: [string | null, ...unknown[]],
    fieldName: string,
  ) =>
    | boolean
    | null
    | string
    | undefined
    | Promise<boolean | null | string | undefined>;
}
