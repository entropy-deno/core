import { Utils } from '../utils.class.ts';

export async function $(
  strings: TemplateStringsArray,
  ...values: string[]
): Promise<boolean> {
  const fullCommand = values.reduce(
    (accumulator, value, index) =>
      `${accumulator}${value}${strings[index + 1]}`,
    strings[0] ?? '',
  );

  const parts = fullCommand.split(' ');

  return await Utils.executeShellCommand(parts[0], parts.slice(1));
}
