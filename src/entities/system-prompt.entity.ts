import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'system_prompts' })
export class SystemPrompt extends BaseEntity {
  @Column({ type: 'text', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false })
  version: number;

  @Column({ name: 'is_active', type: 'boolean', nullable: false })
  isActive: boolean;
}
