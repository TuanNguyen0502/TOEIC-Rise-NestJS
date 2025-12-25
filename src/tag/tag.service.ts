import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/enums/ErrorCode.enum';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Chuyển chuỗi "tag1;tag2;tag3" -> List<Tag>
   * - Nếu tag chưa tồn tại thì tạo mới
   */
  async getTagsFromString(tagsString?: string | null): Promise<Tag[]> {
    return this.getTagsFromStringWithResolver(tagsString, async (name) => {
      return this.findOrCreateTag(name);
    });
  }

  /**
   * Corresponds to: tagService.getTagsFromString(tagsString, resolver)
   * Generic method that accepts a resolver function to handle each tag name
   */
  async getTagsFromStringWithResolver(
    tagsString: string | null | undefined,
    resolver: (tagName: string) => Promise<Tag>,
  ): Promise<Tag[]> {
    const tags: Tag[] = [];

    if (!tagsString || !tagsString.trim()) {
      return tags;
    }

    const tagNames = tagsString.split(';');

    for (const tagNameRaw of tagNames) {
      const tagName = tagNameRaw.trim();
      if (!tagName) continue;

      const tag = await resolver(tagName);
      tags.push(tag);
    }

    return tags;
  }

  /**
   * Corresponds to: tagService.parseTagsAllowCreate(tagsString)
   * Parse tags from string, create if not exists
   */
  async parseTagsAllowCreate(tagsString: string): Promise<Tag[]> {
    return this.getTagsFromStringWithResolver(tagsString, async (name) => {
      let tag = await this.tagRepository.findOne({
        where: { name },
      });

      if (!tag) {
        tag = this.tagRepository.create({ name });
        tag = await this.tagRepository.save(tag);
      }

      return tag;
    });
  }

  /**
   * Corresponds to: tagService.parseTagsOrThrow(tagsString)
   * Parse tags from string, throw exception if tag not found
   */
  async parseTagsOrThrow(tagsString: string): Promise<Tag[]> {
    return this.getTagsFromStringWithResolver(tagsString, async (name) => {
      const tag = await this.tagRepository.findOne({
        where: { name },
      });

      if (!tag) {
        throw new AppException(
          ErrorCode.RESOURCE_NOT_FOUND,
          `Tag name: ${name}`,
        );
      }

      return tag;
    });
  }

  /**
   * Corresponds to: tagService.checkExistsIds(tagIds)
   * Check if all tag IDs exist
   */
  async checkExistsIds(tagIds: Set<number>): Promise<void> {
    if (tagIds.size === 0) return;

    const count = await this.tagRepository.count({
      where: { id: In([...tagIds]) },
    });

    if (count < tagIds.size) {
      throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, 'Tag');
    }
  }

  private async findOrCreateTag(tagName: string): Promise<Tag> {
    let tag = await this.tagRepository.findOne({
      where: { name: tagName },
    });

    if (!tag) {
      tag = this.tagRepository.create({ name: tagName });
      tag = await this.tagRepository.save(tag);
    }

    return tag;
  }
}
