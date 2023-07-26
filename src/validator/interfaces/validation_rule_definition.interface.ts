export interface ValidationRuleDefinition {
  name: string;
  errorMessage: string;
  validate: (
    input: [string | null, ...any[]],
    fieldName: string,
  ) => boolean | Promise<boolean>;
}
