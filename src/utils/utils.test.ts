import { expect } from 'https://deno.land/std@0.221.0/expect/expect.ts';
import { Utils } from './utils.class.ts';

Deno.test('utils module', async (test) => {
  await test.step('implements properly the callerFile() function', () => {
    expect(Utils.callerFile()).toContain('utils.class.ts');
  });

  await test.step('implements properly the mergeDeep() function', () => {
    const a = {
      a: 1,
      b: {
        c: 2,
      },
    };

    const b = {
      b: {
        d: 3,
      },
    };

    expect(Utils.mergeDeep(a, b)).toEqual({
      a: 1,
      b: {
        c: 2,
        d: 3,
      } as Record<string, unknown>,
    });
  });

  await test.step('implements properly the escapeEntities() function', () => {
    expect(Utils.escapeEntities(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  await test.step('implements properly the range() function', () => {
    expect(Utils.range(4, 10)).toEqual([4, 5, 6, 7, 8, 9, 10]);
    expect(Utils.range(6)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
