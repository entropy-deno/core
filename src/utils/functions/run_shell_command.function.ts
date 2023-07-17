export function runShellCommand(name: string, args: string[] = []): void {
  const command = new Deno.Command(
    name,
    {
      args,
      stdin: 'null',
      stdout: 'null',
      stderr: 'null',
    },
  );

  command.spawn();
}
