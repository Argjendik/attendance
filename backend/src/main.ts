import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  
  // Enable CORS
  app.enableCors();
  
  // Validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Attendance API')
    .setDescription('API documentation for the Attendance system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Calculate frontend dist path
  const frontendPath = join(__dirname, 'public');
  logger.log(`Serving frontend from: ${frontendPath}`);

  // Serve static frontend files AFTER API routes
  app.use((req, res, next) => {
    const apiPaths = ['/api', '/auth', '/users', '/offices', '/agents', '/attendance'];
    if (apiPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    if (req.path.includes('.')) {
      express.static(frontendPath)(req, res, next);
    } else {
      const indexPath = join(frontendPath, 'index.html');
      logger.log(`Serving index.html from: ${indexPath}`);
      res.sendFile(indexPath);
    }
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap(); 