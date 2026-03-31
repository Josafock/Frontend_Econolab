"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = require("node:path");
const node_fs_1 = require("node:fs");
const request = require("supertest");
let currentStage = 'start';
async function main() {
    currentStage = 'env';
    const runtimeMode = process.env.APP_RUNTIME_MODE ?? 'web-online';
    process.env.DATABASE_TYPE ??= 'sqlite';
    process.env.DATABASE_SQLITE_PATH ??= (0, node_path_1.resolve)(process.cwd(), 'tmp', `runtime-bootstrap-${runtimeMode}.sqlite`);
    process.env.DATABASE_SYNCHRONIZE ??= 'false';
    process.env.DATABASE_LOGGING ??= 'false';
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(process.env.DATABASE_SQLITE_PATH), { recursive: true });
    (0, node_fs_1.rmSync)(process.env.DATABASE_SQLITE_PATH, { force: true });
    const startedAt = Date.now();
    currentStage = 'imports';
    const { createConfiguredApp } = await Promise.resolve().then(() => require('../src/main'));
    const { RuntimeDiagnosticsService } = await Promise.resolve().then(() => require('../src/runtime/runtime-diagnostics.service'));
    currentStage = 'create-app';
    const { app, runtimeConfig } = await createConfiguredApp({
        logger: false,
        abortOnError: false,
    });
    try {
        currentStage = 'app-init';
        await app.init();
        currentStage = 'diagnostics';
        const diagnostics = app.get(RuntimeDiagnosticsService).getDiagnostics();
        const prefixPath = runtimeConfig.globalPrefix
            ? `/${runtimeConfig.globalPrefix}`
            : '/';
        currentStage = 'http-request';
        const response = await request(app.getHttpServer()).get(prefixPath).expect(200);
        currentStage = 'stdout';
        console.log(JSON.stringify({
            ok: true,
            runtimeMode,
            status: diagnostics.status,
            bootMs: Date.now() - startedAt,
            rssMb: diagnostics.process.memoryRssMb,
            globalPrefix: runtimeConfig.globalPrefix,
            responseStatus: response.status,
            responseBody: response.text,
            issues: diagnostics.issues.map((issue) => issue.code),
        }, null, 2));
    }
    finally {
        currentStage = 'app-close';
        await app.close();
    }
}
main().catch((error) => {
    console.error(JSON.stringify({
        ok: false,
        stage: currentStage,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : null,
    }, null, 2));
    process.exit(1);
});
//# sourceMappingURL=runtime-bootstrap-single.js.map