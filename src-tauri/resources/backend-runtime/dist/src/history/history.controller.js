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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_enum_1 = require("../common/enums/roles.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const file_response_util_1 = require("../common/utils/file-response.util");
const document_artifact_service_1 = require("../storage/document-artifact.service");
const history_service_1 = require("./history.service");
let HistoryController = class HistoryController {
    historyService;
    documentArtifacts;
    constructor(historyService, documentArtifacts) {
        this.historyService = historyService;
        this.documentArtifacts = documentArtifacts;
    }
    getDashboard(date, search, fromDate, toDate) {
        return this.historyService.getDashboard(date, search, fromDate, toDate);
    }
    generateDailyCut(date) {
        return this.historyService.generateDailyCut(date);
    }
    getDailyCutsOverview(fromDate, toDate) {
        return this.historyService.getDailyCutsOverview(fromDate, toDate);
    }
    getDailyCutById(id) {
        return this.historyService.getDailyCutById(+id);
    }
    deleteDailyCut(id) {
        return this.historyService.deleteDailyCut(+id);
    }
    async exportDailyCut(id, res) {
        const buffer = await this.historyService.exportDailyCutCsv(+id);
        (0, file_response_util_1.sendAttachmentFile)(res, this.documentArtifacts.buildCsvFilename('corte-dia', id), 'text/csv; charset=utf-8', buffer);
    }
};
exports.HistoryController = HistoryController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Query)('date')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('fromDate')),
    __param(3, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], HistoryController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Post)('daily-cuts'),
    __param(0, (0, common_1.Body)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HistoryController.prototype, "generateDailyCut", null);
__decorate([
    (0, common_1.Get)('daily-cuts/overview'),
    __param(0, (0, common_1.Query)('fromDate')),
    __param(1, (0, common_1.Query)('toDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HistoryController.prototype, "getDailyCutsOverview", null);
__decorate([
    (0, common_1.Get)('daily-cuts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HistoryController.prototype, "getDailyCutById", null);
__decorate([
    (0, common_1.Delete)('daily-cuts/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HistoryController.prototype, "deleteDailyCut", null);
__decorate([
    (0, common_1.Get)('daily-cuts/:id/export'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HistoryController.prototype, "exportDailyCut", null);
exports.HistoryController = HistoryController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_enum_1.Role.Admin),
    (0, common_1.Controller)('history'),
    __metadata("design:paramtypes", [history_service_1.HistoryService,
        document_artifact_service_1.DocumentArtifactService])
], HistoryController);
//# sourceMappingURL=history.controller.js.map