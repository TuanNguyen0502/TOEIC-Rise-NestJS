import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('TOEIC Rise API')
    .setDescription(
      'API documentation for TOEIC Rise application. This API provides endpoints for authentication, user management, tests, questions, and chat features.',
    )
    .setVersion('1.0')
    .setContact('TOEIC Rise Team', '', '')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Enter JWT token',
      },
      'JWT', // tên scheme sẽ dùng ở @ApiBearerAuth('JWT')
    )
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });
}
