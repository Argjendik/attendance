"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const express = require("express");
const path_1 = require("path");
const common_2 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const logger = new common_2.Logger('Bootstrap');
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Attendance API')
        .setDescription('API documentation for the Attendance system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const frontendPath = (0, path_1.join)(__dirname, '../../dist');
    logger.log(`Serving frontend from: ${frontendPath}`);
    app.use(express.static(frontendPath));
    app.use('*', (req, res, next) => {
        if (req.url.startsWith('/api')) {
            next();
        }
        else {
            const indexPath = (0, path_1.join)(frontendPath, 'index.html');
            logger.log(`Serving index.html from: ${indexPath}`);
            res.sendFile(indexPath);
        }
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map