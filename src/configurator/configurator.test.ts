import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Configurator } from './configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

const configurator = inject(Configurator);

Deno.test('configurator module', async (test) => {
  await test.step('implements properly .env parsing', () => {
    assertEquals(configurator.getEnv<boolean>('TESTING'), true);
  });

  await test.step('implements properly configuration parsing', () => {
    assertEquals(configurator.entries.host, 'localhost');
  });
});
