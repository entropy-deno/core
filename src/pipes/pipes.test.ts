import { expect } from 'https://deno.land/std@0.219.0/expect/expect.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { AbbreviatePipe } from './abbreviate.pipe.ts';
import { BoolPipe } from './bool.pipe.ts';
import { CamelCasePipe } from './camel_case.pipe.ts';
import { ConstantCasePipe } from './constant_case.pipe.ts';
import { DatePipe } from './date.pipe.ts';
import { FloatPipe } from './float.pipe.ts';
import { IntPipe } from './int.pipe.ts';
import { JsonPipe } from './json.pipe.ts';
import { KebabCasePipe } from './kebab_case.pipe.ts';
import { LowerCasePipe } from './lower_case.pipe.ts';
import { NumberPipe } from './number.pipe.ts';
import { PascalCasePipe } from './pascal_case.pipe.ts';
import { PercentPipe } from './percent.pipe.ts';
import { SnakeCasePipe } from './snake_case.pipe.ts';
import { TitleCasePipe } from './title_case.pipe.ts';
import { UpperCasePipe } from './upper_case.pipe.ts';

Deno.test('pipes module', async (test) => {
  await test.step('properly produces output based on pipe input', () => {
    expect(inject(AbbreviatePipe).transform('120')).toBe('120');
    expect(inject(AbbreviatePipe).transform('1200')).toBe('1.2K');
    expect(inject(AbbreviatePipe).transform('1 200 000')).toBe('1.2M');
    expect(inject(AbbreviatePipe).transform('1 200 000 000')).toBe('1.2B');

    expect(inject(BoolPipe).transform('1')).toBe(true);
    expect(inject(BoolPipe).transform('0')).toBe(false);

    expect(inject(CamelCasePipe).transform('foo_bar')).toBe('fooBar');
    expect(inject(ConstantCasePipe).transform('foo-bar')).toBe('FOO_BAR');

    expect(inject(DatePipe).transform('2040-01-01')).toEqual(
      new Date('2040-01-01'),
    );

    expect(inject(FloatPipe).transform('1.5')).toBe(1.5);

    expect(inject(IntPipe).transform('1.0')).toBe(1);

    expect(inject(JsonPipe).transform('{"foo":"bar"}')).toEqual({ foo: 'bar' });

    expect(inject(KebabCasePipe).transform('fooBar')).toBe('foo-bar');

    expect(inject(LowerCasePipe).transform('FOO')).toBe('foo');

    expect(inject(NumberPipe).transform('1.5')).toBe(1.5);

    expect(inject(PascalCasePipe).transform('foo_bar')).toBe('FooBar');

    expect(inject(PercentPipe).transform('1.4')).toBe('140%');

    expect(inject(SnakeCasePipe).transform('fooBar')).toBe('foo_bar');

    expect(inject(TitleCasePipe).transform('foo_bar')).toBe('Foo Bar');

    expect(inject(UpperCasePipe).transform('foo bar')).toBe('FOO BAR');
  });
});
