import { assertEquals } from '@std/testing/asserts.ts';
import { Encrypter } from './encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

Deno.test('encrypter module', async (test) => {
  Deno.env.set('CRYPTO_KEY', 'test');

  await test.step('encrypter properly hashes a string', async () => {
    const hash = await inject(Encrypter).hash('test hash');

    assertEquals(typeof hash, 'string');
  });
});
