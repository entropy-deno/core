export class RichRequest {
  constructor(private readonly request: Request) {
    this.request = request;
  }

  public get fullUrl(): string {
    return this.request.url;
  }

  public header(name: string): string | null {
    return this.request.headers.get(name);
  }

  public get headers(): Headers {
    return this.request.headers;
  }

  public get method(): string {
    return this.request.method;
  }

  public get origin(): string {
    return new URL(this.request.url).origin;
  }

  public get path(): string {
    return new URL(this.request.url).pathname;
  }

  public get port(): number {
    return Number(new URL(this.request.url).port);
  }

  public get protocol(): string {
    return new URL(this.request.url).protocol;
  }

  public get query(): Record<string, string> {
    const params: Record<string, string> = {};

    for (const [key, value] of new URL(this.request.url).searchParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  public get url(): URL {
    return new URL(this.request.url);
  }
}
