export class Scheduler {
  public schedule(
    identifier: string,
    callback: () => void,
    schedule: string,
  ): void {
    Deno.cron(identifier, schedule, callback);
  }

  public interval(callback: () => void, milliseconds: number): void {
    setInterval(callback, milliseconds);
  }

  public timeout(callback: () => void, milliseconds: number): void {
    setTimeout(callback, milliseconds);
  }
}
