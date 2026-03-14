import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { env } from '../../../config/env';
import { StoragePort, UploadedFile } from '../../domain/ports/storage.port';

export class S3Adapter implements StoragePort {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      ...(env.STORAGE_ENDPOINT && { endpoint: env.STORAGE_ENDPOINT }),
      region: env.STORAGE_REGION,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY,
        secretAccessKey: env.STORAGE_SECRET_KEY,
      },
    });
  }

  async upload(file: UploadedFile, folder: string): Promise<string> {
    const ext = extname(file.originalName).toLowerCase() || '.jpg';
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: key,
      }),
    );
  }

  async getUrl(key: string): Promise<string> {
    return `${env.STORAGE_PUBLIC_URL}/${key}`;
  }
}
