import {
  decodeBase64,
  encodeBase64,
} from 'https://deno.land/std@0.212.0/encoding/base64.ts';
import { Configurator } from '../configurator/configurator.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

interface UuidOptions {
  clean?: boolean;
}

export class Encrypter {
  private readonly configurator = inject(Configurator);

  private readonly decoder = new TextDecoder();

  private readonly encoder = new TextEncoder();

  public async compareHash(plainText: string, hash: string): Promise<boolean> {
    return await this.hash(plainText) === hash;
  }

  public decodeBase64(encoded: string): string {
    return this.decoder.decode(decodeBase64(encoded));
  }

  public encodeBase64(plainText: string | ArrayBuffer): string {
    return encodeBase64(plainText);
  }

  public generateRandomString(length = 32): string {
    if (length % 2 !== 0) {
      throw new Error('Provided random string length is not even');
    }

    const buffer = new Uint8Array(length / 2);

    crypto.getRandomValues(buffer);

    let result = '';

    for (let i = 0; i < buffer.length; ++i) {
      result += (`0${buffer[i].toString(16)}`).slice(-2);
    }

    return result;
  }

  public generateUuid({ clean = false }: UuidOptions = {}): string {
    const uuid = crypto.randomUUID();

    return clean ? uuid.replaceAll('-', '') : uuid;
  }

  public async hash(plainText: string): Promise<string> {
    const keyBuffer = this.encoder.encode(
      this.configurator.entries.encryption.key,
    );

    const buffer = this.encoder.encode(plainText);

    const hmacKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign('HMAC', hmacKey, buffer);

    return [...new Uint8Array(signature)].map((byte) =>
      byte.toString(16).padStart(2, '0')
    ).join('');
  }
}
