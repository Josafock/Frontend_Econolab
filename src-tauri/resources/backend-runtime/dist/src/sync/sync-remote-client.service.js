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
exports.SyncRemoteClientService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SyncRemoteClientService = class SyncRemoteClientService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('sync');
    }
    getRemoteBaseUrl() {
        const baseUrl = this.runtimeConfig.remoteBaseUrl?.trim();
        if (!baseUrl) {
            throw new Error('SYNC_REMOTE_BASE_URL no esta configurado para esta instancia.');
        }
        return baseUrl.replace(/\/+$/, '');
    }
    getRemoteHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.runtimeConfig.machineAuthEnabled && this.runtimeConfig.machineToken) {
            headers[this.runtimeConfig.machineHeaderName] = this.runtimeConfig.machineToken;
        }
        return headers;
    }
    async request(path, body) {
        const baseUrl = this.getRemoteBaseUrl();
        const url = `${baseUrl}/${path.replace(/^\/+/, '')}`;
        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: this.getRemoteHeaders(),
                body: JSON.stringify(body ?? {}),
                signal: AbortSignal.timeout(this.runtimeConfig.remoteTimeoutMs),
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new common_1.ServiceUnavailableException(`No fue posible conectar con el servidor central en ${baseUrl}. ${message}`);
        }
        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Sync remoto respondio ${response.status}: ${responseText || response.statusText}`);
        }
        return (await response.json());
    }
    claimPendingBatch(limit) {
        return this.request('sync/outbox/claim', { limit });
    }
    ackBatch(leaseToken, ids) {
        return this.request('sync/outbox/ack', {
            leaseToken,
            ids,
        });
    }
    failBatch(leaseToken, failures) {
        return this.request('sync/outbox/fail', {
            leaseToken,
            failures,
        });
    }
    applyInbound(mutations) {
        return this.request('sync/outbox/inbound/apply', {
            mutations,
        });
    }
    exportBootstrapPage(options) {
        return this.request('sync/bootstrap/export', options);
    }
};
exports.SyncRemoteClientService = SyncRemoteClientService;
exports.SyncRemoteClientService = SyncRemoteClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SyncRemoteClientService);
//# sourceMappingURL=sync-remote-client.service.js.map