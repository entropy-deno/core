import { HttpMethod } from './enums/http_method.enum.ts';

export class RichRequest {
  constructor(private readonly request: Request, public readonly nonce: string) {
    this.request = request;
  }

  public header(name: string): string | null {
    return this.request.headers.get(name);
  }

  public get headers(): Headers {
    return this.request.headers;
  }

  public async form(): Promise<FormData> {
    return await this.request.formData();
  }

  public async input(name: string): Promise<FormDataEntryValue | null> {
    return (await this.form()).get(name);
  }

  public get integrity(): string {
    return this.request.integrity;
  }

  public get isAjax(): boolean {
    return !!(this.header('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest' ||
      this.header('accept')?.includes('application/json'));
  }

  public get method(): HttpMethod {
    return this.request.method as HttpMethod;
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

  public queryParam(name: string): string | null {
    return new URL(this.request.url).searchParams.get(name);
  }

  public get queryParams(): Record<string, string> {
    const params: Record<string, string> = {};

    for (const [key, value] of new URL(this.request.url).searchParams.entries()) {
      params[key] = value;
    }

    return params;
  }

  public get url(): string {
    return this.request.url;
  }
}
