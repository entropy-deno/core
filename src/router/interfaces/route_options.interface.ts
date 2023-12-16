import { Constructor } from '../../utils/interfaces/constructor.interface.ts';
import { HttpStatus } from '../../http/enums/http_status.enum.ts';
import { Middleware } from '../../http/interfaces/middleware.interface.ts';
import { Pipe } from '../../pipes/interfaces/pipe.interface.ts';
import { RedirectDestination } from '../types/redirect_destination.type.ts';
import { ValidatorRulesList } from '../../validator/interfaces/validator_rules_list.interface.ts';

export interface RouteOptions {
  assert?: Record<
    string,
    Partial<ValidatorRulesList> | Record<string, unknown>
  >;
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  middleware?: Constructor<Middleware>[];
  name?: string;
  pipes?: Record<string, Constructor<Pipe>>;
  redirectTo?: RedirectDestination;
  statusCode?: HttpStatus;
  view?: string;
}
