import {
  assertEquals,
  assertStringIncludes,
} from 'https://deno.land/std@0.205.0/assert/mod.ts';
import { Utils } from './utils.class.ts';

Deno.test('utils module', async (test) => {
  await test.step('implements properly the callerFile() function', () => {
    assertStringIncludes(Utils.callerFile(), 'utils.class.ts');
  });

  await test.step('implements properly the deepMerge() function', () => {
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

    assertEquals(Utils.deepMerge(a, b), {
      a: 1,
      b: {
        c: 2,
        d: 3,
      } as Record<string, unknown>,
    });
  });

  await test.step('implements properly the escapeEntities() function', () => {
    assertEquals(Utils.escapeEntities(`&<>"'`), '&amp;&lt;&gt;&quot;&#39;');
  });

  await test.step('implements properly the range() function', () => {
    assertEquals(Utils.range(4, 10), [4, 5, 6, 7, 8, 9, 10]);
    assertEquals(Utils.range(6), [0, 1, 2, 3, 4, 5, 6]);
  });
});
