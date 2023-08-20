import { RoutePath } from './route_path.type.ts';
import { Url } from './url.type.ts';

export type RedirectDestination = RoutePath | Url | {
  name: string;
  params?: Record<string, string>;
};
