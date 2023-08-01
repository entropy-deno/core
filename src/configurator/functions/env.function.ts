import { Configurator } from '../configurator.service.ts';
import { EnvVariable } from '../types/env_variable.type.ts';
import { inject } from '../../injector/functions/inject.function.ts';

const configurator = inject(Configurator);

export function env<T extends EnvVariable>(key: string): T | undefined {
  return configurator.getEnv(key);
}
