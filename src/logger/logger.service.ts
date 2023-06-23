export class Logger {
  public error(message: string, colors: string[] = []): void {
    console.error(
      `\n%c[ERROR] %c${message}`,
      'color: gray',
      'color: red',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public info(message: string, colors: string[] = []): void {
    console.log(
      `\n%c[INFO] %c${message}`,
      'color: gray',
      'color: mediumblue',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public log(message: string, colors: string[] = []): void {
    const output = `\n%c[LOG] %c${message}`;

    console.log(
      output,
      'color: gray',
      'color: lightgray',
      ...colors.map((color) => `color: ${color}`),
    );
  }

  public warn(message: string, colors: string[] = []): void {
    console.warn(
      `\n%c[WARN] %c${message}`,
      'color: gray',
      'color: orange',
      ...colors.map((color) => `color: ${color}`),
    );
  }
}
