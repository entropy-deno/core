import { getCookies } from 'https://deno.land/std@0.198.0/http/cookie.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { HttpMethod } from './enums/http_method.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class HttpRequest {
  private readonly encrypter = inject(Encrypter);

  private readonly cspNonce = this.encrypter.generateRandomString(16);

  constructor(
    private readonly request: Request,
    private readonly info?: Deno.ServeHandlerInfo,
  ) {
    this.request = request;
  }

  public get cache(): RequestCache {
    return this.request.cache;
  }

  public cookie(name: string): string | null {
    return this.cookies[name] ?? null;
  }

  public get cookies(): Record<string, string> {
    return getCookies(this.headers);
  }

  public get credentials(): RequestCredentials {
    return this.request.credentials;
  }

  public get destination(): RequestDestination {
    return this.request.destination;
  }

  public header(name: string): string | null {
    return this.headers.get(name);
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

  public get ip(): string | null {
    return this.info?.remoteAddr.hostname ?? null;
  }

  public get isAjax(): boolean {
    return !!(this.header('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest' ||
      this.header('accept')?.includes('application/json'));
  }

  public async isFormRequest(): Promise<boolean> {
    return ![HttpMethod.Get, HttpMethod.Head].includes(await this.method());
  }

  public isSecure(): boolean {
    return ['https', 'wss'].includes(this.protocol);
  }

  public locale(): string | string[] {
    return this.header('accept-language')?.slice(0, 2) ?? 'en';
  }

  public async method(): Promise<HttpMethod> {
    if (!this.headers.get('content-type')) {
      return HttpMethod.Get;
    }

    const method = await this.input('_method') ?? this.request.method ??
      HttpMethod.Get;

    return (
      Object.values(HttpMethod).find((value) => value === method) ??
        HttpMethod.Get
    );
  }

  public get mode(): RequestMode {
    return this.request.mode;
  }

  public get nonce(): string {
    return this.cspNonce;
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

    for (
      const [key, value] of new URL(this.request.url).searchParams.entries()
    ) {
      params[key] = value;
    }

    return params;
  }

  public get referrer(): string {
    return this.request.referrer;
  }

  public get referrerPolicy(): ReferrerPolicy {
    return this.request.referrerPolicy;
  }

  public get url(): string {
    return this.request.url;
  }
}
