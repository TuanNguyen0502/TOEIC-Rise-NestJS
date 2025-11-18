import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';

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
    const tags: Tag[] = [];

    if (!tagsString || !tagsString.trim()) {
      return tags;
    }

    const tagNames = tagsString.split(';');

    for (const tagNameRaw of tagNames) {
      const tagName = tagNameRaw.trim();
      if (!tagName) continue;

      const tag = await this.findOrCreateTag(tagName);
      tags.push(tag);
    }

    return tags;
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
