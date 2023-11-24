import { expect } from 'https://deno.land/std@0.208.0/expect/expect.ts';
import { Configurator } from './configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

const configurator = inject(Configurator);

Deno.test('configurator module', async (test) => {
  await test.step('implements properly .env parsing', () => {
    expect(configurator.getEnv<boolean>('TESTING')).toBe(true);
  });

  await test.step('implements properly configuration parsing', () => {
    expect(configurator.entries.host).toBe('localhost');
  });
});
