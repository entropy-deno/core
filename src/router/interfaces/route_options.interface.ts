import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { HttpStatus } from '../../http/enums/http_status.enum.ts';
import { Middleware } from '../../http/interfaces/middleware.interface.ts';
import { Pipe } from '../../pipes/interfaces/pipe.interface.ts';
import { RedirectDestination } from '../types/redirect_destination.type.ts';
import { ValidationRulesList } from '../../validator/interfaces/validation_rules_list.interface.ts';

export interface RouteOptions {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  injectRequest?: boolean;
  middleware?: Constructor<Middleware>[];
  name?: string;
  paramPipes?: Record<string, Constructor<Pipe>>;
  redirectTo?: RedirectDestination;
  statusCode?: HttpStatus;
  validationRules?: Record<
    string,
    Partial<ValidationRulesList> | Record<string, unknown>
  >;
  view?: string;
}
