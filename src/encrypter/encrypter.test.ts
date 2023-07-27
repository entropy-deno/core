import { assertEquals } from 'https://deno.land/std@0.196.0/assert/mod.ts';
import { Encrypter } from './encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('encrypter module', async (test) => {
  Deno.env.set('CRYPTO_KEY', 'test');

  const encrypter = inject(Encrypter);

  await test.step('encrypter properly hashes a string', async () => {
    const hash = await encrypter.hash('test');

    assertEquals(typeof hash, 'string');
  });

  await test.step('encrypter properly compares hash with plain text', async () => {
    const hash = await encrypter.hash('test');
    const equal = await encrypter.compareHash('test', hash);

    assertEquals(equal, true);
  });
});
