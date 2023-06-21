export class Logger {
  public error(message: string, colors: string[] = []): void {
    console.error(
      `\n%c[ERROR] ${message}`,
      'color: red',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public info(message: string, colors: string[] = []): void {
    console.log(
      `\n%c[INFO] ${message}`,
      'color: mediumblue',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public log(message: string, colors: string[] = []): void {
    const output = `\n%c[LOG] ${message}`;

    console.log(
      output,
      'color: gray',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public warn(message: string, colors: string[] = []): void {
    console.warn(
      `\n%c[WARN] ${message}`,
      'color: orange',
      ...colors.map((color) => `color: ${color}`),
    );
  }
}
