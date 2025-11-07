import { ValueTransformer } from 'typeorm';

/**
 * TypeORM transformer to store a string array as a JSON string
 * and retrieve it as a string array.
 *
 * @example
 * @Column({
 * type: 'json',
 * nullable: true,
 * transformer: new StringListTransformer()
 * })
 * options: string[];
 */
export class StringListTransformer implements ValueTransformer {
  /**
   * Used to marshal data when writing to the database.
   */
  to(value: string[] | null): string | null {
    if (!value) {
      return '[]';
    }
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[]';
    }
  }

  /**
   * Used to unmarshal data when reading from the database.
   */
  from(value: string | null): string[] {
    if (!value) {
      return [];
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return [];
    }
  }
}
