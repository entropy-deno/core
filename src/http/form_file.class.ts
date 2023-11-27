import { Encrypter } from '../encrypter/encrypter.service.ts';
import { inject } from '../injector/functions/inject.function.ts';

export class FormFile {
  private readonly encrypter = inject(Encrypter);

  constructor(private readonly file: File) {}

  public get contentType(): string {
    return this.file.type;
  }

  public get size(): number {
    return this.file.size;
  }

  public async upload(destination: string, fileName?: string): Promise<string> {
    if (!fileName) {
      fileName = `${this.encrypter.generateUuid({ clean: true })}.${
        this.file.name.split('.').pop()
      }`;
    }

    const buffer = await this.file.arrayBuffer();

    const content = new Uint8Array(buffer);
    const path = `${destination}/${fileName}`;

    try {
      await Deno.writeFile(path, content);
    } catch {
      throw new Error(`Cannot upload file ${fileName} to ${destination}`);
    }

    return fileName;
  }
}
