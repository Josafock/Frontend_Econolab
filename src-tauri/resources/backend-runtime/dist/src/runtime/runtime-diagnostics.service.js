"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeDiagnosticsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_os_1 = require("node:os");
const integration_policy_service_1 = require("./integration-policy.service");
const runtime_diagnostics_util_1 = require("./runtime-diagnostics.util");
let RuntimeDiagnosticsService = class RuntimeDiagnosticsService {
    configService;
    integrationPolicy;
    constructor(configService, integrationPolicy) {
        this.configService = configService;
        this.integrationPolicy = integrationPolicy;
    }
    get appRuntimeConfig() {
        return this.configService.getOrThrow('app');
    }
    get databaseRuntimeConfig() {
        return this.configService.getOrThrow('database');
    }
    get integrationRuntimeConfig() {
        return this.configService.getOrThrow('integrations');
    }
    get storageRuntimeConfig() {
        return this.configService.getOrThrow('storage');
    }
    get syncRuntimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    getDiagnostics() {
        const memoryUsage = process.memoryUsage();
        const diagnostics = (0, runtime_diagnostics_util_1.buildRuntimeDiagnostics)({
            app: this.appRuntimeConfig,
            database: this.databaseRuntimeConfig,
            integrations: this.integrationRuntimeConfig,
            storage: this.storageRuntimeConfig,
            sync: this.syncRuntimeConfig,
            frontendUrlConfigured: Boolean(this.integrationPolicy.frontendUrl),
            mailConfigured: this.integrationPolicy.mailConfigured,
            googleAuthConfigured: this.integrationPolicy.googleAuthConfigured,
            gmailOauthConfigured: this.integrationPolicy.gmailOauthConfigured,
        });
        return {
            ...diagnostics,
            generatedAt: new Date().toISOString(),
            process: {
                pid: process.pid,
                nodeVersion: process.version,
                platform: process.platform,
                uptimeSeconds: Math.round(process.uptime()),
                memoryRssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
                memoryHeapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
                memoryExternalMb: Math.round(memoryUsage.external / (1024 * 1024)),
            },
            host: {
                cpuCount: (0, node_os_1.cpus)().length,
                totalMemoryMb: Math.round((0, node_os_1.totalmem)() / (1024 * 1024)),
                freeMemoryMb: Math.round((0, node_os_1.freemem)() / (1024 * 1024)),
            },
        };
    }
};
exports.RuntimeDiagnosticsService = RuntimeDiagnosticsService;
exports.RuntimeDiagnosticsService = RuntimeDiagnosticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        integration_policy_service_1.IntegrationPolicyService])
], RuntimeDiagnosticsService);
//# sourceMappingURL=runtime-diagnostics.service.js.map