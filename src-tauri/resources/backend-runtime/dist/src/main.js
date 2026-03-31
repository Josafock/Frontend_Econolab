"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfiguredApp = createConfiguredApp;
exports.bootstrap = bootstrap;
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_zod_filter_1 = require("./common/filters/http-exception-zod.filter");
const validation_exception_factory_1 = require("./common/validation/validation-exception.factory");
const helmet_1 = require("helmet");
async function configureApp(app) {
    const configService = app.get(config_1.ConfigService);
    const runtimeConfig = configService.getOrThrow('app');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        exceptionFactory: validation_exception_factory_1.validationExceptionFactory,
    }));
    if (runtimeConfig.helmetEnabled) {
        app.use((0, helmet_1.default)());
    }
    if (runtimeConfig.corsEnabled) {
        app.enableCors({
            origin: runtimeConfig.corsOrigins,
            methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
            allowedHeaders: 'Content-Type, Authorization',
        });
    }
    app.useGlobalFilters(new http_exception_zod_filter_1.HttpExceptionZodFilter());
    app.setGlobalPrefix(runtimeConfig.globalPrefix);
    return runtimeConfig;
}
async function createConfiguredApp(options) {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, options);
    const runtimeConfig = await configureApp(app);
    return {
        app,
        runtimeConfig,
    };
}
async function bootstrap() {
    const { app, runtimeConfig } = await createConfiguredApp();
    if (runtimeConfig.host) {
        await app.listen(runtimeConfig.port, runtimeConfig.host);
    }
    else {
        await app.listen(runtimeConfig.port);
    }
    console.log(`Server running on ${await app.getUrl()} [${runtimeConfig.runtimeMode}]`);
    return app;
}
if (require.main === module) {
    void bootstrap();
}
//# sourceMappingURL=main.js.map