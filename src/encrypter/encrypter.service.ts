import {
  decode as base64Decode,
  encode as base64Encode,
} from 'https://deno.land/std@0.198.0/encoding/base64.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class Encrypter {
  private readonly configurator = inject(Configurator);

  private readonly decoder = new TextDecoder();

  private readonly encoder = new TextEncoder();

  public async compareHash(plainText: string, hash: string): Promise<boolean> {
    return await this.hash(plainText) === hash;
  }

  public base64Decode(encoded: string): string {
    return this.decoder.decode(base64Decode(encoded));
  }

  public base64Encode(plainText: string | ArrayBuffer): string {
    return base64Encode(plainText);
  }

  public generateRandomString(length = 32): string {
    if (length % 2 !== 0) {
      throw new Error('Random string length must be even');
    }

    const buffer = new Uint8Array(length / 2);

    crypto.getRandomValues(buffer);

    let result = '';

    for (let i = 0; i < buffer.length; ++i) {
      result += (`0${buffer[i].toString(16)}`).slice(-2);
    }

    return result;
  }

  public generateUuid(): string {
    return crypto.randomUUID();
  }

  public async hash(plainText: string): Promise<string> {
    const keyBuffer = this.encoder.encode(this.configurator.entries.encryption.key);
    const dataBuffer = this.encoder.encode(plainText);

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', hmacKey, dataBuffer);

    return [...new Uint8Array(signature)].map((byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }
}
