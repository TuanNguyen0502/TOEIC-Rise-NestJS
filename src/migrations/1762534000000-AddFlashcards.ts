import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFlashcards1762534000000 implements MigrationInterface {
  name = 'AddFlashcards1762534000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create flashcards table
    await queryRunner.query(
      `CREATE TABLE \`flashcards\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime NULL,
        \`updated_at\` datetime NULL,
        \`name\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`access_type\` enum('PRIVATE', 'PUBLIC') NOT NULL DEFAULT 'PRIVATE',
        \`favourite_count\` int NOT NULL DEFAULT 0,
        \`user_id\` bigint NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_flashcard_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // Create flashcard_items table
    await queryRunner.query(
      `CREATE TABLE \`flashcard_items\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime NULL,
        \`updated_at\` datetime NULL,
        \`vocabulary\` varchar(255) NOT NULL,
        \`definition\` text NOT NULL,
        \`audio_url\` varchar(512) NULL,
        \`pronunciation\` varchar(255) NULL,
        \`flashcard_id\` bigint NOT NULL,
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`fk_flashcard_item_flashcard\` FOREIGN KEY (\`flashcard_id\`) REFERENCES \`flashcards\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
    );

    // Create flashcard_favourites table
    await queryRunner.query(
      `CREATE TABLE \`flashcard_favourites\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`created_at\` datetime NULL,
        \`updated_at\` datetime NULL,
        \`user_id\` bigint NOT NULL,
        \`flashcard_id\` bigint NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uc_user_flashcard\` (\`user_id\`, \`flashcard_id\`),
        CONSTRAINT \`fk_ff_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`),
        CONSTRAINT \`fk_ff_flashcard\` FOREIGN KEY (\`flashcard_id\`) REFERENCES \`flashcards\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop flashcard_favourites table
    await queryRunner.query(`DROP TABLE IF EXISTS \`flashcard_favourites\``);

    // Drop flashcard_items table
    await queryRunner.query(`DROP TABLE IF EXISTS \`flashcard_items\``);

    // Drop flashcards table
    await queryRunner.query(`DROP TABLE IF EXISTS \`flashcards\``);
  }
}

