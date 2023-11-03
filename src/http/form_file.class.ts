export class FormFile {
  constructor(private readonly file: File) {}

  public get contentType(): string {
    return this.file.type;
  }

  public get size(): number {
    return this.file.size;
  }

  public async upload(destination: string, fileName: string): Promise<void> {
    const buffer = await this.file.arrayBuffer();

    const content = new Uint8Array(buffer);
    const path = `${destination}/${fileName}`;

    try {
      const textContent = new TextDecoder('utf-8').decode(content);

      await Deno.writeTextFile(path, textContent);
    } catch {
      try {
        await Deno.writeFile(path, content);
      } catch {
        throw new Error(`Cannot upload file ${fileName} to ${destination}`);
      }
    }
  }
}
