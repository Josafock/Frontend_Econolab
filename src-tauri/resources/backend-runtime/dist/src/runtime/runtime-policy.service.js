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
exports.RuntimePolicyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let RuntimePolicyService = class RuntimePolicyService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('app');
    }
    get runtimeMode() {
        return this.runtimeConfig.runtimeMode;
    }
    get allowHardDelete() {
        return this.runtimeConfig.allowHardDelete;
    }
    assertHardDeleteAllowed(resourceLabel = 'registro') {
        if (this.allowHardDelete) {
            return;
        }
        throw new common_1.ConflictException(`La eliminacion permanente de ${resourceLabel} esta deshabilitada en el runtime ${this.runtimeMode}. Usa baja logica o una purga controlada en el servidor central.`);
    }
};
exports.RuntimePolicyService = RuntimePolicyService;
exports.RuntimePolicyService = RuntimePolicyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RuntimePolicyService);
//# sourceMappingURL=runtime-policy.service.js.map