import { expect } from 'https://deno.land/std@0.219.0/expect/expect.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Validator } from './validator.service.ts';

Deno.test('validator module', async (test) => {
  const validator = inject(Validator);

  await test.step('validator properly asserts data satisfies requirements', async () => {
    expect(
      Object.keys(
        await validator.validate({
          email: 'test@entropy.deno.dev',
        }, {
          email: {
            email: true,
          },
        }),
      ),
    ).toHaveLength(0);

    expect(
      (await validator.validate({
        email: '@invalid@entropy.deno.dev',
      }, {
        email: {
          email: true,
          maxLength: 12,
        },
      })).email,
    ).toHaveLength(2);
  });
});
