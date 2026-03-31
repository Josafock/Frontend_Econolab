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
exports.RuntimeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_enum_1 = require("../common/enums/roles.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const runtime_diagnostics_service_1 = require("./runtime-diagnostics.service");
let RuntimeController = class RuntimeController {
    runtimeDiagnostics;
    constructor(runtimeDiagnostics) {
        this.runtimeDiagnostics = runtimeDiagnostics;
    }
    getDiagnostics() {
        return this.runtimeDiagnostics.getDiagnostics();
    }
};
exports.RuntimeController = RuntimeController;
__decorate([
    (0, common_1.Get)('diagnostics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "getDiagnostics", null);
exports.RuntimeController = RuntimeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    (0, common_1.Controller)('runtime'),
    __metadata("design:paramtypes", [runtime_diagnostics_service_1.RuntimeDiagnosticsService])
], RuntimeController);
//# sourceMappingURL=runtime.controller.js.map