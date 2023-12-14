export class Scheduler {
  public interval(callback: () => void, milliseconds: number): void {
    setInterval(callback, milliseconds);
  }

  public schedule(
    identifier: string,
    callback: () => void,
    schedule: string | Deno.CronSchedule,
  ): void {
    Deno.cron(identifier, schedule, callback);
  }

  public timeout(callback: () => void, milliseconds: number): void {
    setTimeout(callback, milliseconds);
  }
}
