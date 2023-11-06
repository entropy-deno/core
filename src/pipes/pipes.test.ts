import { assertEquals } from 'https://deno.land/std@0.205.0/assert/mod.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { BoolPipe } from './bool.pipe.ts';
import { CamelCasePipe } from './camel_case.pipe.ts';
import { ConstantCasePipe } from './constant_case.pipe.ts';
import { DatePipe } from './date.pipe.ts';
import { FloatPipe } from './float.pipe.ts';
import { IntPipe } from './int.pipe.ts';
import { JsonPipe } from './json.pipe.ts';
import { LowerCasePipe } from './lower_case.pipe.ts';
import { NumberPipe } from './number.pipe.ts';
import { ParamCasePipe } from './param_case.pipe.ts';
import { PascalCasePipe } from './pascal_case.pipe.ts';
import { PercentPipe } from './percent.pipe.ts';
import { SnakeCasePipe } from './snake_case.pipe.ts';
import { TitleCasePipe } from './title_case.pipe.ts';
import { UpperCasePipe } from './upper_case.pipe.ts';

Deno.test('pipes module', async (test) => {
  await test.step('properly produces output based on pipe input', () => {
    assertEquals(inject(BoolPipe).transform('1'), true);
    assertEquals(inject(BoolPipe).transform('0'), false);

    assertEquals(inject(CamelCasePipe).transform('foo_bar'), 'fooBar');
    assertEquals(inject(ConstantCasePipe).transform('foo-bar'), 'FOO_BAR');

    assertEquals(
      inject(DatePipe).transform('2040-01-01'),
      new Date('2040-01-01'),
    );

    assertEquals(inject(FloatPipe).transform('1.5'), 1.5);

    assertEquals(inject(IntPipe).transform('1.0'), 1);

    assertEquals(inject(JsonPipe).transform('{"foo":"bar"}'), { foo: 'bar' });

    assertEquals(inject(LowerCasePipe).transform('FOO'), 'foo');

    assertEquals(inject(NumberPipe).transform('1.5'), 1.5);

    assertEquals(inject(ParamCasePipe).transform('fooBar'), 'foo-bar');

    assertEquals(inject(PascalCasePipe).transform('foo_bar'), 'FooBar');

    assertEquals(inject(PercentPipe).transform('1.4'), '140%');

    assertEquals(inject(SnakeCasePipe).transform('fooBar'), 'foo_bar');

    assertEquals(inject(TitleCasePipe).transform('foo_bar'), 'Foo Bar');

    assertEquals(inject(UpperCasePipe).transform('foo bar'), 'FOO BAR');
  });
});
