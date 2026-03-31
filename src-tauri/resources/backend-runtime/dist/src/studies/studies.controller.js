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
exports.StudiesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const studies_service_1 = require("./studies.service");
const create_study_dto_1 = require("./dto/create-study.dto");
const update_study_dto_1 = require("./dto/update-study.dto");
const create_study_detail_dto_1 = require("./dto/create-study-detail.dto");
const update_study_detail_dto_1 = require("./dto/update-study-detail.dto");
const update_study_detail_status_dto_1 = require("./dto/update-study-detail-status.dto");
const study_entity_1 = require("./entities/study.entity");
let StudiesController = class StudiesController {
    studiesService;
    constructor(studiesService) {
        this.studiesService = studiesService;
    }
    search(search = '', type, status, page = 1, limit = 10) {
        return this.studiesService.search(search, type, status, +page, +limit);
    }
    exists(code) {
        return this.studiesService.existsByCode(code);
    }
    getSuggestedCode(type) {
        return this.studiesService.getSuggestedCode(type ?? study_entity_1.StudyType.STUDY);
    }
    async create(dto) {
        const study = await this.studiesService.create(dto);
        return {
            message: 'Estudio creado correctamente.',
            data: study,
        };
    }
    findOne(id) {
        return this.studiesService.findOne(+id);
    }
    async update(id, dto) {
        const study = await this.studiesService.update(+id, dto);
        return {
            message: 'Estudio actualizado correctamente.',
            data: study,
        };
    }
    remove(id) {
        return this.studiesService.softDelete(+id);
    }
    hardRemove(id) {
        return this.studiesService.hardDelete(+id);
    }
    listDetails(id) {
        return this.studiesService.listDetails(+id);
    }
    async createDetail(id, dto) {
        const detail = await this.studiesService.createDetail(+id, dto);
        return {
            message: 'Detalle de estudio creado correctamente.',
            data: detail,
        };
    }
    async updateDetail(detailId, dto) {
        const detail = await this.studiesService.updateDetail(+detailId, dto);
        return {
            message: 'Detalle de estudio actualizado correctamente.',
            data: detail,
        };
    }
    async updateDetailStatus(detailId, dto) {
        const detail = await this.studiesService.updateDetailStatus(+detailId, dto);
        return {
            message: dto.isActive
                ? 'Detalle de estudio activado correctamente.'
                : 'Detalle de estudio suspendido correctamente.',
            data: detail,
        };
    }
    removeDetail(detailId) {
        return this.studiesService.softDeleteDetail(+detailId);
    }
    hardRemoveDetail(detailId) {
        return this.studiesService.hardDeleteDetail(+detailId);
    }
};
exports.StudiesController = StudiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object, Object]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('exists'),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "exists", null);
__decorate([
    (0, common_1.Get)('next-code'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "getSuggestedCode", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_study_dto_1.CreateStudyDto]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_study_dto_1.UpdateStudyDto]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)(':id/hard'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "hardRemove", null);
__decorate([
    (0, common_1.Get)(':id/details'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "listDetails", null);
__decorate([
    (0, common_1.Post)(':id/details'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_study_detail_dto_1.CreateStudyDetailDto]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "createDetail", null);
__decorate([
    (0, common_1.Put)('details/:detailId'),
    __param(0, (0, common_1.Param)('detailId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_study_detail_dto_1.UpdateStudyDetailDto]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "updateDetail", null);
__decorate([
    (0, common_1.Put)('details/:detailId/status'),
    __param(0, (0, common_1.Param)('detailId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_study_detail_status_dto_1.UpdateStudyDetailStatusDto]),
    __metadata("design:returntype", Promise)
], StudiesController.prototype, "updateDetailStatus", null);
__decorate([
    (0, common_1.Delete)('details/:detailId'),
    __param(0, (0, common_1.Param)('detailId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "removeDetail", null);
__decorate([
    (0, common_1.Delete)('details/:detailId/hard'),
    __param(0, (0, common_1.Param)('detailId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], StudiesController.prototype, "hardRemoveDetail", null);
exports.StudiesController = StudiesController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('studies'),
    __metadata("design:paramtypes", [studies_service_1.StudiesService])
], StudiesController);
//# sourceMappingURL=studies.controller.js.map