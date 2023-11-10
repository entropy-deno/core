export interface ValidationRule {
  name: string;
  errorMessage: string;
  validate: (
    input: [string | null, ...unknown[]],
    fieldName: string,
  ) => boolean | Promise<boolean | null | string | undefined>;
}
