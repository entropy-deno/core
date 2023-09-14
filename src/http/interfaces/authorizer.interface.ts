export interface Authorizer {
  authorize(): boolean | Promise<boolean>;
}
