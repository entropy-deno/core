import { getCookies } from 'https://deno.land/std@0.212.0/http/cookie.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { Encrypter } from '../encrypter/encrypter.service.ts';
import { FormFile } from './form_file.class.ts';
import { HttpError } from './http_error.class.ts';
import { HttpMethod } from './enums/http_method.enum.ts';
import { HttpStatus } from './enums/http_status.enum.ts';
import { inject } from '../injector/functions/inject.function.ts';
import { Localizator } from '../localizator/localizator.service.ts';
import { RedirectDestination } from '../router/types/redirect_destination.type.ts';
import { RoutePath } from '../router/types/route_path.type.ts';
import { RouteStore } from '../router/route_store.service.ts';
import { Session } from './session.class.ts';

export class HttpRequest {
  private readonly configurator = inject(Configurator);

  private readonly encrypter = inject(Encrypter);

  private readonly cspNonce = this.encrypter.generateRandomString(24);

  private formData?: FormData;

  private readonly localizator = inject(Localizator);

  private matchedPattern?: RoutePath;

  private readonly routeStore = inject(RouteStore);

  private sessionObject?: Session;

  constructor(
    private readonly request: Request,
    private readonly info?: Deno.ServeHandlerInfo,
  ) {
    this.request = request;
  }

  public $setMatchedPattern(pattern: RoutePath) {
    this.matchedPattern = pattern;
  }

  public cache(): RequestCache {
    return this.request.cache ?? 'default';
  }

  public cookie(name: string): string | undefined {
    return this.cookies[name];
  }

  public get cookies(): Record<string, string> {
    return getCookies(this.headers);
  }

  public credentials(): RequestCredentials {
    return this.request.credentials ?? 'same-origin';
  }

  public async createRedirect(
    destination: RedirectDestination,
    variables: Record<string, unknown> = {},
    statusCode = HttpStatus.Found,
  ): Promise<Response> {
    if (statusCode < 300 || statusCode > 399) {
      throw new Error('Invalid redirect status code');
    }

    for (const [key, value] of Object.entries(variables)) {
      await this.session.flash(key, value);
    }

    if (typeof destination === 'string') {
      return Response.redirect(
        destination[0] === '/'
          ? this.routeStore.url(destination as RoutePath)
          : destination,
        statusCode,
      );
    }

    for (const { name, path } of this.routeStore.routes) {
      if (name === destination.name) {
        let resolvedPath = path;

        for (
          const [param, paramValue] of Object.entries(destination.params ?? {})
        ) {
          resolvedPath = resolvedPath.replace(
            `:${param}`,
            paramValue,
          ) as RoutePath;
        }

        return Response.redirect(resolvedPath, statusCode);
      }
    }

    throw new Error(`Invalid named route '${destination.name}'`);
  }

  public async createRedirectBack(
    variables: Record<string, unknown> = {},
    statusCode = HttpStatus.Found,
  ): Promise<Response> {
    const destination = await this.session.get<RedirectDestination>(
      '@entropy/previous_location',
    ) ?? this.header('referer') as RedirectDestination | undefined;

    if (!destination) {
      throw new HttpError(HttpStatus.NotFound);
    }

    return await this.createRedirect(
      destination,
      variables,
      statusCode,
    );
  }

  public destination(): RequestDestination {
    return this.request.destination;
  }

  public header(name: string): string | undefined {
    return this.headers.get(name) ?? undefined;
  }

  public get headers(): Headers {
    return this.request.headers;
  }

  public async file<TFile = FormFile | FormFile[]>(
    name: string,
  ): Promise<TFile> {
    const files = await this.files();

    return files[name] as TFile;
  }

  public async files(): Promise<Record<string, FormFile | FormFile[]>> {
    const files: Record<string, FormFile | FormFile[]> = {};

    for (const [name, field] of (await this.form()).entries()) {
      if (!(field instanceof File)) {
        continue;
      }

      if (name in files) {
        files[name] = [
          ...(Array.isArray(files[name])
            ? files[name] as FormFile[]
            : [files[name]] as FormFile[]),
          new FormFile(field),
        ];

        continue;
      }

      if (name.endsWith('[]')) {
        const fieldName = name.slice(0, -2);

        if (!(fieldName in files)) {
          files[fieldName] = [];
        }

        (files[fieldName] as FormFile[]).push(new FormFile(field));

        continue;
      }

      files[name] = new FormFile(field);
    }

    return files;
  }

  public async flash(key: string, value: unknown): Promise<void> {
    await this.session.flash(key, value);
  }

  public async flashed<TValue = unknown>(
    key: string,
  ): Promise<TValue | undefined> {
    return await this.session.flashed(key);
  }

  public async form(): Promise<FormData> {
    try {
      this.formData = await this.request.formData();
    } catch {
      if (!this.formData) {
        this.formData = new FormData();
      }
    }

    return this.formData;
  }

  public async input(name: string): Promise<string | undefined> {
    const entry = (await this.form()).get(name);

    return entry instanceof File ? undefined : entry ?? undefined;
  }

  public integrity(): string {
    return this.request.integrity;
  }

  public ip(): string | undefined {
    return this.info?.remoteAddr.hostname;
  }

  public isAjaxRequest(): boolean {
    return !!(this.header('x-requested-with')?.toLowerCase() ===
        'xmlhttprequest' ||
      this.header('accept')?.includes('application/json'));
  }

  public async isFormRequest(): Promise<boolean> {
    return this.headers.has('content-type') && ![
      HttpMethod.Get,
      HttpMethod.Head,
      HttpMethod.PropFind,
      HttpMethod.Search,
    ].includes(await this.method());
  }

  public async isMultipartRequest(): Promise<boolean> {
    return (await this.isFormRequest()) &&
      !!this.header('content-type')?.includes('multipart/form-data');
  }

  public isSecure(): boolean {
    return ['https', 'wss'].includes(this.protocol());
  }

  public async isStaticFileRequest(): Promise<boolean> {
    if (this.path() === '/') {
      return false;
    }

    if (
      this.configurator.entries.seo.robots && this.path() === '/robots.txt' ||
      this.configurator.entries.seo.sitemap && this.path() === '/sitemap.xml'
    ) {
      return true;
    }

    try {
      await Deno.stat(`public${this.path()}`);

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
      return Object.values(HttpMethod).find((value) =>
        value === this.request.method
      ) ?? HttpMethod.Get;
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

    const paramGroups = urlPattern.exec(this.url())?.pathname.groups ?? {};

    for (const [paramName, paramValue] of Object.entries(paramGroups)) {
      if (paramValue === '') {
        paramGroups[paramName] = undefined;
      }
    }

    return { ...paramGroups } as Record<string, string | undefined>;
  }

  public path(): RoutePath {
    return new URL(this.request.url).pathname as RoutePath;
  }

  public pattern(): string | undefined {
    return this.matchedPattern;
  }

  public port(): number {
    return Number(new URL(this.request.url).port);
  }

  public protocol(): string {
    return new URL(this.request.url).protocol.replace(':', '');
  }

  public queryParam(name: string): string | undefined {
    return new URL(this.request.url).searchParams.get(name) ?? undefined;
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

  public queryString(): string {
    return new URL(this.request.url).search;
  }

  public referrer(): string {
    return this.request.referrer;
  }

  public referrerPolicy(): ReferrerPolicy {
    return this.request.referrerPolicy;
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

  public url(): string {
    return this.request.url;
  }
}
