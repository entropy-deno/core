import { EnumValuesUnion } from '../utils/types/enum_values_union.type.ts';
import { HttpMethod } from './enums/http_method.enum.ts';

export class HttpClient {
  private async fetch<TPayload>(
    url: string,
    payload: Record<string, string | Blob>,
    headers: Record<string, string>,
    method: EnumValuesUnion<HttpMethod>,
  ): Promise<TPayload | null> {
    try {
      const body = new FormData();

      for (const [key, value] of Object.entries(payload)) {
        body.append(key, value);
      }

      const response = await fetch(url, {
        body,
        headers,
        method,
      });

      return response.json();
    } catch {
      return null;
    }
  }

  public async copy<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Copy);
  }

  public async delete<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Delete);
  }

  public async get<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Get);
  }

  public async head<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Head);
  }

  public async lock<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Lock);
  }

  public async mkcol<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Mkcol);
  }

  public async move<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Move);
  }

  public async options<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(
      url,
      payload,
      headers,
      HttpMethod.Options,
    );
  }

  public async patch<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Patch);
  }

  public async post<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Post);
  }

  public async propFind<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(
      url,
      payload,
      headers,
      HttpMethod.PropFind,
    );
  }

  public async propPatch<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(
      url,
      payload,
      headers,
      HttpMethod.PropPatch,
    );
  }

  public async put<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Put);
  }

  public async search<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Search);
  }

  public async trace<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Trace);
  }

  public async unlock<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Unlock);
  }
}
