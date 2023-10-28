import { HttpRequest } from '../../http/http_request.class.ts';

export interface TemplateCompilerOptions {
  file?: string;
  recursiveCall?: boolean;
  request?: HttpRequest;
}
