import { inject } from '../../injector/functions/inject.function.ts';
import { Router } from '../router.service.ts';

export function createRouter() {
  return inject(Router);
}
