import { HttpMethod } from './enums/http_method.enum.ts';
import { ValuesUnion } from '../utils/types/values_union.type.ts';

export class HttpClient {
  private async fetch<T>(
    url: string,
    payload: Record<string, string | Blob>,
    headers: Record<string, string>,
    method: ValuesUnion<HttpMethod>,
  ): Promise<T | null> {
    try {
      const body = new FormData();

      for (const [key, value] of Object.entries(payload)) {
        body.append(key, value);
      }

      const response: Response = await fetch(url, {
        body,
        headers,
        method,
      });

      return response.json();
    } catch {
      return null;
    }
  }

  public async delete<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Delete);
  }

  public async get<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Get);
  }

  public async options<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Options);
  }

  public async patch<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Patch);
  }

  public async post<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Post);
  }

  public async put<T>(
    url: string,
    payload: Record<string, string | Blob> = {},
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    return await this.fetch<T>(url, payload, headers, HttpMethod.Put);
  }
}
