export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  size: number;
}

export interface StoragePort {
  upload(file: UploadedFile, folder: string): Promise<string>; // retorna la key
  delete(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}
