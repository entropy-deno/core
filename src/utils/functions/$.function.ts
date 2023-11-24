import { Utils } from '../utils.class.ts';

export async function $(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<boolean> {
  const fullCmmand = strings.reduce((accumulator, string, index) => {
    const value = values[index] ?? '';

    return `${accumulator}${string}${value}`;
  });

  const parts = fullCmmand.split(' ');

  return await Utils.executeShellCommand(parts[0], parts.slice(1));
}
