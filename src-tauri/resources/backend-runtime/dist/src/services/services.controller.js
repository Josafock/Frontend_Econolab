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
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const services_service_1 = require("./services.service");
const create_service_dto_1 = require("./dto/create-service.dto");
const update_service_dto_1 = require("./dto/update-service.dto");
const update_service_status_dto_1 = require("./dto/update-service-status.dto");
const service_order_entity_1 = require("./entities/service-order.entity");
const pdf_response_util_1 = require("../common/utils/pdf-response.util");
const document_artifact_service_1 = require("../storage/document-artifact.service");
let ServicesController = class ServicesController {
    servicesService;
    documentArtifacts;
    constructor(servicesService, documentArtifacts) {
        this.servicesService = servicesService;
        this.documentArtifacts = documentArtifacts;
    }
    async create(dto) {
        const service = await this.servicesService.create(dto);
        return {
            message: 'Servicio creado correctamente.',
            data: service,
        };
    }
    search(search, status, branchName, fromDate, toDate, page = '1', limit = '10') {
        return this.servicesService.search({
            search,
            status,
            branchName,
            fromDate,
            toDate,
            page: Number(page),
            limit: Number(limit),
        });
    }
    getSuggestedFolio() {
        return this.servicesService.getSuggestedFolio();
    }
    findOne(id) {
        return this.servicesService.findOne(id);
    }
    async downloadReceipt(id, res) {
        const buffer = await this.servicesService.generateReceiptPdf(id);
        (0, pdf_response_util_1.sendInlinePdf)(res, this.documentArtifacts.buildPdfFilename('recibo', id), buffer);
    }
    async downloadLabels(id, res) {
        const buffer = await this.servicesService.generateTubeLabelsPdf(id);
        (0, pdf_response_util_1.sendInlinePdf)(res, this.documentArtifacts.buildPdfFilename('etiquetas', id), buffer);
    }
    async downloadTicket(id, res) {
        const buffer = await this.servicesService.generateTicketPdf(id);
        (0, pdf_response_util_1.sendInlinePdf)(res, this.documentArtifacts.buildPdfFilename('ticket', id), buffer);
    }
    findByFolio(folio) {
        return this.servicesService.findByFolio(folio);
    }
    async update(id, dto) {
        const service = await this.servicesService.update(id, dto);
        return {
            message: 'Servicio actualizado correctamente.',
            data: service,
        };
    }
    async updateStatus(id, dto) {
        const service = await this.servicesService.updateStatus(id, dto);
        return {
            message: 'Estatus de servicio actualizado correctamente.',
            data: service,
        };
    }
    remove(id) {
        return this.servicesService.softDelete(id);
    }
    hardRemove(id) {
        return this.servicesService.hardDelete(id);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_dto_1.CreateServiceDto]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('branchName')),
    __param(3, (0, common_1.Query)('fromDate')),
    __param(4, (0, common_1.Query)('toDate')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('next-folio'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "getSuggestedFolio", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/receipt'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "downloadReceipt", null);
__decorate([
    (0, common_1.Get)(':id/labels'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "downloadLabels", null);
__decorate([
    (0, common_1.Get)(':id/ticket'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "downloadTicket", null);
__decorate([
    (0, common_1.Get)('folio/:folio'),
    __param(0, (0, common_1.Param)('folio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "findByFolio", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_service_dto_1.UpdateServiceDto]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "update", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_service_status_dto_1.UpdateServiceStatusDto]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/hard'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "hardRemove", null);
exports.ServicesController = ServicesController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('services'),
    __metadata("design:paramtypes", [services_service_1.ServicesService,
        document_artifact_service_1.DocumentArtifactService])
], ServicesController);
//# sourceMappingURL=services.controller.js.map