import { Inject, Injectable } from '@nestjs/common';
import {
  v2 as Cloudinary,
  type UploadApiResponse,
  type UploadApiErrorResponse,
} from 'cloudinary';
import { MessageConstant } from 'src/common/constants/messages.constant';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) {}

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const resourceType = this.getResourceType(file.originalname);
    return this.uploadBuffer(file.buffer, file.originalname, resourceType);
  }

  async uploadBuffer(
    buffer: Buffer,
    filename?: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  ): Promise<string> {
    // Nếu không truyền resourceType, tự động đoán (Audio phải là video)
    if (resourceType === 'auto' && filename) {
      if (/\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(filename)) {
        resourceType = 'video';
      } else if (/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
        resourceType = 'image';
      }
    }

    return new Promise<string>((resolve, reject) => {
      const stream = this.cloudinary.uploader.upload_stream(
        { resource_type: resourceType }, // Sử dụng đúng resource_type
        (
          err: UploadApiErrorResponse | undefined,
          res: UploadApiResponse | undefined,
        ) => {
          if (err)
            return reject(
              new Error(err.message || MessageConstant.CLOUDINARY_ERROR),
            );
          if (!res) return reject(new Error('Empty Cloudinary response'));
          return resolve(res.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async updateFile(file: Express.Multer.File, oldUrl: string): Promise<string> {
    // Nếu có url cũ thì xóa đi
    if (oldUrl) {
      await this.deleteFile(oldUrl);
    }
    // Upload file mới
    return this.uploadFile(file);
  }

  async deleteFile(url: string): Promise<void> {
    try {
      if (!this.isCloudinaryUrl(url)) return;

      const publicId = this.extractPublicId(url);
      const resourceType = this.getResourceTypeFromUrl(url);

      if (publicId) {
        await this.cloudinary.uploader.destroy(publicId, {
          resource_type: resourceType,
        });
      }
    } catch (error) {
      // Bên Java ném lỗi, nhưng thường xóa file media phụ không nên chặn luồng chính
      // Tuy nhiên để giống Java, ta throw exception
      console.error('Delete file error:', error);
      throw new AppException(
        ErrorCode.FILE_DELETE_FAILED,
        'File delete failed',
      );
    }
  }

  validateImageFile(file: Express.Multer.File) {
    if (!file || !this.isValidSuffixImage(file.originalname)) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Invalid image file format.',
      );
    }
  }

  validateAudioFile(file: Express.Multer.File) {
    if (!file || !this.isValidSuffixAudio(file.originalname)) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Invalid audio file format.',
      );
    }
  }

  validateImageURL(url: string) {
    if (!url || !this.isValidSuffixImage(url)) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Invalid image URL format.',
      );
    }
  }

  validateAudioURL(url: string) {
    if (!url || !this.isValidSuffixAudio(url)) {
      throw new AppException(
        ErrorCode.INVALID_REQUEST,
        'Invalid audio URL format.',
      );
    }
  }

  isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com');
  }

  private isValidSuffixImage(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name);
  }

  private isValidSuffixAudio(name: string): boolean {
    return /\.(mp3|wav|aac|flac|ogg|m4a)$/i.test(name);
  }

  private getResourceType(
    filename: string,
  ): 'image' | 'video' | 'raw' | 'auto' {
    if (this.isValidSuffixImage(filename)) return 'image';
    if (this.isValidSuffixAudio(filename)) return 'video'; // Cloudinary coi Audio là Video
    return 'auto';
  }

  private getResourceTypeFromUrl(url: string): string {
    if (!url) return 'raw';
    if (url.includes('/image/')) return 'image';
    if (url.includes('/video/')) return 'video';
    if (url.includes('/raw/')) return 'raw';
    return this.getResourceType(url);
  }

  private extractPublicId(url: string): string | null {
    if (!url) return null;
    // URL mẫu: https://res.cloudinary.com/demo/image/upload/v1234567/folder/filename.jpg

    try {
      const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
      const match = url.match(regex);
      return match ? match[1] : null;
      // Logic regex này an toàn hơn split('/') của Java một chút
      // vì nó xử lý được cả trường hợp có hoặc không có version (v12345)
    } catch (e) {
      return null;
    }
  }

  validateImageName(name?: string) {
    if (!name || !/\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(name)) {
      throw new Error('Invalid image file format.');
    }
  }
}
