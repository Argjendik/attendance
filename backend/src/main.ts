import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with proper configuration
  app.enableCors({
    origin: true, // Allow all origins temporarily
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 3600
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Attendance System API')
    .setDescription('API documentation for the Attendance System')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header'
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  
  // Serve Swagger UI with proper configuration
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true
    },
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Attendance System API Documentation'
  });
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap(); 