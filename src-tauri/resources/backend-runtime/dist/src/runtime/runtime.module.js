"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeModule = void 0;
const common_1 = require("@nestjs/common");
const integration_policy_service_1 = require("./integration-policy.service");
const runtime_controller_1 = require("./runtime.controller");
const runtime_diagnostics_service_1 = require("./runtime-diagnostics.service");
const runtime_policy_service_1 = require("./runtime-policy.service");
let RuntimeModule = class RuntimeModule {
};
exports.RuntimeModule = RuntimeModule;
exports.RuntimeModule = RuntimeModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            runtime_policy_service_1.RuntimePolicyService,
            integration_policy_service_1.IntegrationPolicyService,
            runtime_diagnostics_service_1.RuntimeDiagnosticsService,
        ],
        controllers: [runtime_controller_1.RuntimeController],
        exports: [
            runtime_policy_service_1.RuntimePolicyService,
            integration_policy_service_1.IntegrationPolicyService,
            runtime_diagnostics_service_1.RuntimeDiagnosticsService,
        ],
    })
], RuntimeModule);
//# sourceMappingURL=runtime.module.js.map