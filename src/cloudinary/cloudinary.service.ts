import { Inject, Injectable } from '@nestjs/common';
import {
  v2 as Cloudinary,
  type UploadApiResponse,
  type UploadApiErrorResponse,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadBuffer(buffer: Buffer): Promise<string> {
    const url = await new Promise<string>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { resource_type: 'auto' }, // ✅ đúng key
        (
          err: UploadApiErrorResponse | undefined,
          res: UploadApiResponse | undefined,
        ) => {
          if (err) return reject(err);
          if (!res) return reject(new Error('Empty Cloudinary response'));
          return resolve(res.secure_url);
        },
      );
      stream.end(buffer);
    });

    return url;
  }

  validateImageName(name?: string) {
    if (!name || !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name)) {
      throw new Error('Invalid image file format.');
    }
  }
}
