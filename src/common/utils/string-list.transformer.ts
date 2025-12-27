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
  to(value: (string | null)[] | null): string | null {
    if (!value) {
      return '[]';
    }
    try {
      return JSON.stringify(value);
    } catch {
      return '[]';
    }
  }

  /**
   * Used to unmarshal data when reading from the database.
   */
  from(value: string | null): (string | null)[] {
    if (value == null) {
      return [];
    }

    const normalizeArray = (arr: unknown[]): (string | null)[] =>
      arr.map((v) => (v === null || v === undefined ? null : (v as string)));

    if (Array.isArray(value)) {
      return normalizeArray(value as unknown[]);
    }

    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return normalizeArray(parsed);
        }
      } catch {
        return [];
      }
    }

    return [];
  }
}
