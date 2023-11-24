import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { Localizator } from './localizator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('localizator module', async (test) => {
  const localizator = inject(Localizator);

  await test.step('localizator properly sets translations', () => {
    localizator.set('pl', 'hello world', 'witaj świecie');

    assertEquals(localizator.translate('pl', 'hello world'), 'witaj świecie');
  });

  await test.step('localizator properly returns translation list', () => {
    assertEquals(localizator.all('pl'), {
      'hello world': 'witaj świecie',
    });
  });
});
