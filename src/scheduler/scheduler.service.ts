export class Scheduler {
  public interval(
    milliseconds: number,
    callback: () => void | Promise<void>,
  ): void {
    setInterval(callback, milliseconds);
  }

  public schedule(
    identifier: string,
    schedule: string | Deno.CronSchedule,
    callback: () => void | Promise<void>,
  ): void {
    Deno.cron(identifier, schedule, callback);
  }

  public timeout(
    milliseconds: number,
    callback: () => void | Promise<void>,
  ): void {
    setTimeout(callback, milliseconds);
  }
}
