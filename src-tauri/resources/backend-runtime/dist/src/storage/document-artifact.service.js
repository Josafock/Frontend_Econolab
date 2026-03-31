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
exports.DocumentArtifactService = void 0;
const common_1 = require("@nestjs/common");
const storage_path_service_1 = require("./storage-path.service");
let DocumentArtifactService = class DocumentArtifactService {
    storagePaths;
    constructor(storagePaths) {
        this.storagePaths = storagePaths;
    }
    sanitizeToken(value) {
        const normalized = String(value)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9._-]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        return normalized || 'documento';
    }
    buildPdfFilename(prefix, identifier) {
        return `${this.sanitizeToken(prefix)}-${this.sanitizeToken(identifier)}.pdf`;
    }
    buildCsvFilename(prefix, identifier) {
        return `${this.sanitizeToken(prefix)}-${this.sanitizeToken(identifier)}.csv`;
    }
    getDocumentArtifactsDirectory(subdirectory) {
        return this.storagePaths.ensureDocumentArtifactsDirectory(subdirectory);
    }
};
exports.DocumentArtifactService = DocumentArtifactService;
exports.DocumentArtifactService = DocumentArtifactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [storage_path_service_1.StoragePathService])
], DocumentArtifactService);
//# sourceMappingURL=document-artifact.service.js.map