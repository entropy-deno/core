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

  public async put<TPayload>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<TPayload | null> {
    return await this.fetch<TPayload>(url, payload, headers, HttpMethod.Put);
  }
}
