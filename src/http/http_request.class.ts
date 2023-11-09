import { getCookies } from 'https://deno.land/std@0.205.0/http/cookie.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { FormFile } from './form_file.class.ts';
import { HttpMethod } from './enums/http_method.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.service.ts';
import { RoutePath } from '../router/types/route_path.type.ts';
import { Session } from './session.class.ts';

export class HttpRequest {
  private readonly encrypter = inject(Encrypter);

  private readonly cspNonce = this.encrypter.generateRandomString(24);

  private readonly localizator = inject(Localizator);

  private matchedPattern: RoutePath | null = null;

  private sessionObject: Session | null = null;

  constructor(
    private readonly request: Request,
    private readonly info?: Deno.ServeHandlerInfo,
  ) {
    this.request = request;
  }

  public $setMatchedPattern(pattern: RoutePath) {
    this.matchedPattern = pattern;
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

  public async file(name: string): Promise<FormFile | null> {
    const files = await this.files();

    return files[name] ?? null;
  }

  public async files(): Promise<Record<string, FormFile | FormFile[]>> {
    const files: Record<string, FormFile | FormFile[]> = {};

    for (const [name, field] of (await this.form()).entries()) {
      if (!(field instanceof File)) {
        continue;
      }

      if (name.endsWith('[]')) {
        const fieldName = name.slice(0, -2);

        if (!files[fieldName]) {
          files[fieldName] = [];
        }

        (files[fieldName] as FormFile[]).push(new FormFile(field));

        continue;
      }

      files[name] = new FormFile(field);
    }

    return files;
  }

  public async form(): Promise<FormData> {
    if (!this.isFormRequest()) {
      throw new Error('Request is not a form request');
    }

    return await this.request.formData();
  }

  public async input(name: string): Promise<FormDataEntryValue | null> {
    const entry = (await this.form()).get(name);

    return entry instanceof File ? null : entry;
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
    return ![
      HttpMethod.Get,
      HttpMethod.Head,
      HttpMethod.PropFind,
      HttpMethod.Search,
    ].includes(await this.method());
  }

  public get isSecure(): boolean {
    return ['https', 'wss'].includes(this.protocol);
  }

  public async isStaticFileRequest(): Promise<boolean> {
    try {
      await Deno.stat(`public${this.path}`);

      return true;
    } catch {
      return false;
    }
  }

  public async json(): Promise<Record<string, unknown>> {
    return await this.request.json();
  }

  public get locale(): string {
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

  public get params(): Record<string, string | undefined> {
    const urlPattern = new URLPattern({
      pathname: this.matchedPattern ?? '',
    });

    const paramGroups = urlPattern.exec(this.url)?.pathname.groups ?? {};

    for (const [paramName, paramValue] of Object.entries(paramGroups)) {
      if (paramValue === '') {
        paramGroups[paramName] = undefined;
      }
    }

    return { ...paramGroups } as Record<string, string | undefined>;
  }

  public get path(): RoutePath {
    return new URL(this.request.url).pathname as RoutePath;
  }

  public get pattern(): string | null {
    return this.matchedPattern;
  }

  public get port(): number {
    return Number(new URL(this.request.url).port);
  }

  public get protocol(): string {
    return new URL(this.request.url).protocol.replace(':', '');
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

  public get searchString(): string {
    return new URL(this.request.url).search;
  }

  public get session(): Session {
    if (!this.sessionObject) {
      this.sessionObject = new Session(this.cookie('session_id'));
    }

    return this.sessionObject;
  }

  public translate(text: string, quantity = 1): string {
    return this.localizator.translate(this.locale, text, quantity);
  }

  public get url(): string {
    return this.request.url;
  }
}
