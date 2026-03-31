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
exports.StoragePathService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let StoragePathService = class StoragePathService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('storage');
    }
    get rootPath() {
        return this.runtimeConfig.rootPath;
    }
    get profileImagesPath() {
        return this.runtimeConfig.profileImagesPath;
    }
    get documentArtifactsPath() {
        return this.runtimeConfig.documentArtifactsPath;
    }
    ensureDirectory(path) {
        (0, node_fs_1.mkdirSync)(path, { recursive: true });
        return path;
    }
    ensureProfileImagesDirectory() {
        return this.ensureDirectory(this.profileImagesPath);
    }
    ensureDocumentArtifactsDirectory(subdirectory) {
        const path = subdirectory
            ? (0, node_path_1.join)(this.documentArtifactsPath, subdirectory)
            : this.documentArtifactsPath;
        return this.ensureDirectory(path);
    }
};
exports.StoragePathService = StoragePathService;
exports.StoragePathService = StoragePathService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StoragePathService);
//# sourceMappingURL=storage-path.service.js.map