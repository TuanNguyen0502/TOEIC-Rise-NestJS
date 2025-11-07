import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762533126636 implements MigrationInterface {
  name = 'InitialSchema1762533126636';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`roles\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` enum ('ADMIN', 'LEARNER', 'STAFF') NOT NULL, \`description\` text NULL, UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`full_name\` varchar(255) NOT NULL, \`gender\` enum ('MALE', 'FEMALE', 'OTHER') NULL, \`avatar\` varchar(255) NULL, \`account_id\` int NULL, \`role_id\` int NULL, UNIQUE INDEX \`REL_17a709b8b6146c491e6615c29d\` (\`account_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`accounts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`auth_provider\` enum ('LOCAL', 'GOOGLE', 'FACEBOOK', 'GITHUB') NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 0, \`verification_code\` varchar(255) NULL, \`verification_code_expires_at\` timestamp NULL, \`failed_login_attempts\` int NOT NULL DEFAULT '0', \`account_locked_until\` timestamp NULL, \`resend_verification_attempts\` int NOT NULL DEFAULT '0', \`resend_verification_locked_until\` timestamp NULL, \`refresh_token\` varchar(255) NULL, \`refresh_token_expiry_date\` timestamp NULL, UNIQUE INDEX \`IDX_ee66de6cdc53993296d1ceb8aa\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chatbot_ratings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`message_id\` varchar(255) NULL, \`conversation_title\` varchar(255) NOT NULL, \`message\` text NOT NULL, \`rating\` enum ('LIKE', 'DISLIKE') NOT NULL, \`user_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`chat_titles\` (\`id\` varchar(255) NOT NULL, \`conversation_id\` varchar(255) NOT NULL, \`title\` varchar(255) NOT NULL, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`parts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(100) NOT NULL, UNIQUE INDEX \`IDX_609ae5adf9e873c37fcf4484d2\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`test_sets\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`status\` enum ('IN_USE', 'DELETED') NULL, UNIQUE INDEX \`IDX_be17d3b402e3e7e5c2b1b9b819\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tests\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'APPROVED', 'REJECTED', 'DELETED') NOT NULL, \`number_of_learner_tests\` bigint NULL, \`test_set_id\` int NULL, UNIQUE INDEX \`IDX_0a3aa85cb59552f8beadf44f5b\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`question_groups\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`audio_url\` varchar(255) NULL, \`image_url\` varchar(255) NULL, \`position\` int NOT NULL, \`passage\` text NULL, \`transcript\` text NULL, \`test_id\` int NOT NULL, \`part_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`tags\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_d90243459a697eadb8ad56e909\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`questions\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`position\` int NOT NULL, \`content\` text NOT NULL, \`options\` json NULL, \`correct_option\` char(1) NOT NULL, \`explanations\` text NULL, \`question_group_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`system_prompts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`content\` text NOT NULL, \`version\` int NOT NULL, \`is_active\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_tests\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`total_questions\` int NULL, \`correct_answers\` int NULL, \`correct_percent\` double NULL, \`time_spent\` int NULL, \`parts\` json NULL, \`total_score\` int NULL, \`listening_score\` int NULL, \`reading_score\` int NULL, \`listening_correct_answers\` int NULL, \`reading_correct_answers\` int NULL, \`user_id\` int NOT NULL, \`test_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_answers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`question_group_id\` bigint NOT NULL, \`answer\` char(1) NULL, \`is_correct\` tinyint NOT NULL, \`user_test_id\` int NOT NULL, \`question_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`questions_tags\` (\`question_id\` int NOT NULL, \`tag_id\` int NOT NULL, INDEX \`IDX_a8258d23ee1b700d1d9307c189\` (\`question_id\`), INDEX \`IDX_8cbfe2feee1a1eb04d08f3a7de\` (\`tag_id\`), PRIMARY KEY (\`question_id\`, \`tag_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_17a709b8b6146c491e6615c29d7\` FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatbot_ratings\` ADD CONSTRAINT \`FK_8ae4a20ced90b54a7097740d7d7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat_titles\` ADD CONSTRAINT \`FK_7e46a06fe359342f432c461c5f9\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`tests\` ADD CONSTRAINT \`FK_70d4847814335e9b30240211ace\` FOREIGN KEY (\`test_set_id\`) REFERENCES \`test_sets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_groups\` ADD CONSTRAINT \`FK_eb0790ad13effc7d0992da62191\` FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_groups\` ADD CONSTRAINT \`FK_5716ee6c46ecefab4aa4e18ddbf\` FOREIGN KEY (\`part_id\`) REFERENCES \`parts\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions\` ADD CONSTRAINT \`FK_35eb70c00ebc7327c74c151e923\` FOREIGN KEY (\`question_group_id\`) REFERENCES \`question_groups\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_tests\` ADD CONSTRAINT \`FK_68cac053b831b840b7b526f014f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_tests\` ADD CONSTRAINT \`FK_3f7f454a3a433ca44fbec2641be\` FOREIGN KEY (\`test_id\`) REFERENCES \`tests\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_answers\` ADD CONSTRAINT \`FK_bd982ec1182b2d7ae0c938cdb41\` FOREIGN KEY (\`user_test_id\`) REFERENCES \`user_tests\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_answers\` ADD CONSTRAINT \`FK_adae59e684b873b084be36c5a7a\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions_tags\` ADD CONSTRAINT \`FK_a8258d23ee1b700d1d9307c1893\` FOREIGN KEY (\`question_id\`) REFERENCES \`questions\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions_tags\` ADD CONSTRAINT \`FK_8cbfe2feee1a1eb04d08f3a7def\` FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // From V0__initial_database.sql
    await queryRunner.query(
      `INSERT INTO roles (name, description, created_at, updated_at)
       VALUES ('ADMIN', 'Administrator with full access', NOW(), NOW()),
              ('LEARNER', 'Learner with access to learning materials', NOW(), NOW()),
              ('STAFF', 'Staff member with limited access', NOW(), NOW())`,
    );

    // From V0__initial_database.sql
    // Password: Admin@toeicrise2025
    await queryRunner.query(
      'INSERT INTO `accounts` (`id`, `email`, `password`, `auth_provider`, `is_active`, `created_at`, `updated_at`) ' +
        "VALUES (1, 'admin@toeic-rise.com', '$2a$10$k82KIubG8RXFQ2ad7rQCJ.efujvRWBM7CzgXNwEDZohWyOnbrRuc6', 'LOCAL', 1, NOW(), NOW())",
    );

    // From V0__initial_database.sql
    await queryRunner.query(
      'INSERT INTO `users` (`id`, `account_id`, `role_id`, `full_name`, `created_at`, `updated_at`) ' +
        "VALUES (1, 1, 1, 'Administrator', NOW(), NOW())",
    );

    // From V0.2__insert_into_parts_table.sql
    await queryRunner.query(
      `INSERT INTO parts(name)
       VALUES ('Part 1'), ('Part 2'), ('Part 3'), ('Part 4'), ('Part 5'), ('Part 6'), ('Part 7')`,
    );

    // From V0.4__initial_system_prompt.sql
    // We skip the TRUNCATE command as this is the first migration
    await queryRunner.query(
      `INSERT INTO system_prompts (content, version, is_active)
       VALUES (CONCAT(
                'Bạn là TOEIC Rise – một trợ lý học tập thông minh, được thiết kế để hỗ trợ người dùng ôn luyện TOEIC và phân tích hình ảnh. ',
                'Bạn phải luôn duy trì vai trò này trong suốt hội thoại.\\n',
                '\\n',
                'Vai trò và nhiệm vụ:\\n',
                '1. Hỗ trợ TOEIC\\n',
                '+ Giải thích từ vựng, ngữ pháp, cấu trúc câu.\\n',
                '+ Cung cấp kiến thức về cấu trúc đề TOEIC (Listening & Reading).\\n',
                '+ Đưa ra chiến lược làm bài, mẹo luyện tập, cách phân bổ thời gian.\\n',
                '+ Phân tích và giải thích đáp án TOEIC chi tiết, kèm ví dụ minh họa.\\n',
                '\\n',
                '2. Trả lời câu hỏi học tập\\n',
                '+ Ưu tiên các câu hỏi liên quan trực tiếp TOEIC.\\n',
                '+ Nếu câu hỏi thuộc tiếng Anh tổng quát (ngữ pháp, từ vựng, kỹ năng nghe hoặc đọc), có thể trả lời nhưng luôn hướng nội dung về ứng dụng trong TOEIC.\\n',
                '+ Lịch sự từ chối các yêu cầu ngoài phạm vi học thuật như giải trí, chính trị, đời sống cá nhân.\\n',
                '\\n',
                '3. Xử lý hình ảnh\\n',
                '+ Nếu ảnh chứa văn bản: thực hiện OCR để trích xuất văn bản chính xác.\\n',
                '+ Nếu ảnh là đề TOEIC, bảng, biểu đồ hoặc tài liệu học: phân tích chi tiết, giải thích nội dung liên quan TOEIC.\\n',
                '+ Nếu ảnh là tài liệu tiếng Anh nói chung: mô tả và giải thích trong phạm vi học tập.\\n',
                '+ Nếu ảnh không liên quan đến học tập (ví dụ phong cảnh, đồ vật), chỉ mô tả cơ bản, khách quan, không mở rộng.\\n',
                '+ Nếu ảnh có nội dung nhạy cảm (bạo lực, riêng tư, không an toàn), phản hồi an toàn, tránh mô tả chi tiết.\\n',
                '\\n',
                'Nguyên tắc:\\n',
                '+ Phạm vi: chỉ hỗ trợ TOEIC và tiếng Anh liên quan đến TOEIC.\\n',
                '+ Ngữ cảnh: duy trì lịch sử trò chuyện để phản hồi mạch lạc, nhưng không lưu thông tin cá nhân ngoài phạm vi học tập.\\n',
                '+ Phong cách: thân thiện, rõ ràng, dễ hiểu, luôn khuyến khích người học.\\n',
                '+ Tính an toàn: không cung cấp nội dung sai lệch, nhạy cảm hoặc nguy hiểm.\\n',
                '\\n',
                'Cách phản hồi:\\n',
                '+ Trả lời đầy đủ, có ví dụ minh họa, gợi ý thêm bài tập hoặc tài liệu khi phù hợp.\\n',
                '+ Với câu hỏi TOEIC: giải thích rõ ràng, phân tích theo bối cảnh đề thi.\\n',
                '+ Với câu hỏi tiếng Anh tổng quát: luôn hướng về ứng dụng trong TOEIC.\\n',
                '+ Với ảnh: OCR nếu có chữ, mô tả chính xác và phân tích rõ ràng. Nếu ảnh là đề TOEIC thì giải thích đáp án. Nếu ảnh ngoài học thuật thì mô tả ngắn gọn, khách quan.\\n',
                '+ Khi gặp câu hỏi ngoài phạm vi: từ chối lịch sự và nhắc lại rằng bạn chỉ hỗ trợ TOEIC và tiếng Anh phục vụ luyện thi TOEIC.\\n'
        ),
        1,
        TRUE)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`questions_tags\` DROP FOREIGN KEY \`FK_8cbfe2feee1a1eb04d08f3a7def\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions_tags\` DROP FOREIGN KEY \`FK_a8258d23ee1b700d1d9307c1893\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_answers\` DROP FOREIGN KEY \`FK_adae59e684b873b084be36c5a7a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_answers\` DROP FOREIGN KEY \`FK_bd982ec1182b2d7ae0c938cdb41\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_tests\` DROP FOREIGN KEY \`FK_3f7f454a3a433ca44fbec2641be\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_tests\` DROP FOREIGN KEY \`FK_68cac053b831b840b7b526f014f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`questions\` DROP FOREIGN KEY \`FK_35eb70c00ebc7327c74c151e923\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_groups\` DROP FOREIGN KEY \`FK_5716ee6c46ecefab4aa4e18ddbf\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_groups\` DROP FOREIGN KEY \`FK_eb0790ad13effc7d0992da62191\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`tests\` DROP FOREIGN KEY \`FK_70d4847814335e9b30240211ace\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chat_titles\` DROP FOREIGN KEY \`FK_7e46a06fe359342f432c461c5f9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`chatbot_ratings\` DROP FOREIGN KEY \`FK_8ae4a20ced90b54a7097740d7d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_17a709b8b6146c491e6615c29d7\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_8cbfe2feee1a1eb04d08f3a7de\` ON \`questions_tags\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_a8258d23ee1b700d1d9307c189\` ON \`questions_tags\``,
    );
    await queryRunner.query(`DROP TABLE \`questions_tags\``);
    await queryRunner.query(`DROP TABLE \`user_answers\``);
    await queryRunner.query(`DROP TABLE \`user_tests\``);
    await queryRunner.query(`DROP TABLE \`system_prompts\``);
    await queryRunner.query(`DROP TABLE \`questions\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_d90243459a697eadb8ad56e909\` ON \`tags\``,
    );
    await queryRunner.query(`DROP TABLE \`tags\``);
    await queryRunner.query(`DROP TABLE \`question_groups\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_0a3aa85cb59552f8beadf44f5b\` ON \`tests\``,
    );
    await queryRunner.query(`DROP TABLE \`tests\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_be17d3b402e3e7e5c2b1b9b819\` ON \`test_sets\``,
    );
    await queryRunner.query(`DROP TABLE \`test_sets\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_609ae5adf9e873c37fcf4484d2\` ON \`parts\``,
    );
    await queryRunner.query(`DROP TABLE \`parts\``);
    await queryRunner.query(`DROP TABLE \`chat_titles\``);
    await queryRunner.query(`DROP TABLE \`chatbot_ratings\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_ee66de6cdc53993296d1ceb8aa\` ON \`accounts\``,
    );
    await queryRunner.query(`DROP TABLE \`accounts\``);
    await queryRunner.query(
      `DROP INDEX \`REL_17a709b8b6146c491e6615c29d\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` ON \`roles\``,
    );
    await queryRunner.query(`DROP TABLE \`roles\``);
  }
}
