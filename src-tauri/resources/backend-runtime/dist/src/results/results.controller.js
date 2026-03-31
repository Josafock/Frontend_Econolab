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
exports.ResultsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const results_service_1 = require("./results.service");
const create_study_result_dto_1 = require("./dto/create-study-result.dto");
const update_study_result_dto_1 = require("./dto/update-study-result.dto");
const pdf_response_util_1 = require("../common/utils/pdf-response.util");
const document_artifact_service_1 = require("../storage/document-artifact.service");
let ResultsController = class ResultsController {
    resultsService;
    documentArtifacts;
    constructor(resultsService, documentArtifacts) {
        this.resultsService = resultsService;
        this.documentArtifacts = documentArtifacts;
    }
    findOne(id) {
        return this.resultsService.findOne(+id);
    }
    async downloadPdf(id, query, res) {
        const buffer = await this.resultsService.generatePdf(+id, query);
        (0, pdf_response_util_1.sendInlinePdf)(res, this.documentArtifacts.buildPdfFilename('resultado', id), buffer);
    }
    async downloadServicePdf(serviceOrderId, query, res) {
        const buffer = await this.resultsService.generateServicePdf(+serviceOrderId, query);
        (0, pdf_response_util_1.sendInlinePdf)(res, this.documentArtifacts.buildPdfFilename('resultado-servicio', serviceOrderId), buffer);
    }
    getOrCreateByServiceItem(serviceOrderItemId) {
        return this.resultsService.getOrCreateDraftByServiceItem(+serviceOrderItemId);
    }
    async create(dto) {
        const result = await this.resultsService.create(dto);
        return {
            message: 'Resultados registrados correctamente.',
            data: result,
        };
    }
    async update(id, dto) {
        const result = await this.resultsService.update(+id, dto);
        return {
            message: 'Resultados actualizados correctamente.',
            data: result,
        };
    }
    remove(id) {
        return this.resultsService.softDelete(+id);
    }
    hardRemove(id) {
        return this.resultsService.hardDelete(+id);
    }
};
exports.ResultsController = ResultsController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ResultsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)('service-order/:serviceOrderId/pdf'),
    __param(0, (0, common_1.Param)('serviceOrderId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ResultsController.prototype, "downloadServicePdf", null);
__decorate([
    (0, common_1.Get)('service-item/:serviceOrderItemId'),
    __param(0, (0, common_1.Param)('serviceOrderItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "getOrCreateByServiceItem", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_study_result_dto_1.CreateStudyResultDto]),
    __metadata("design:returntype", Promise)
], ResultsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_study_result_dto_1.UpdateStudyResultDto]),
    __metadata("design:returntype", Promise)
], ResultsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/hard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResultsController.prototype, "hardRemove", null);
exports.ResultsController = ResultsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('results'),
    __metadata("design:paramtypes", [results_service_1.ResultsService,
        document_artifact_service_1.DocumentArtifactService])
], ResultsController);
//# sourceMappingURL=results.controller.js.map