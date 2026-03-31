"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageModule = void 0;
const common_1 = require("@nestjs/common");
const document_artifact_service_1 = require("./document-artifact.service");
const profile_image_storage_service_1 = require("./profile-image-storage.service");
const storage_path_service_1 = require("./storage-path.service");
let StorageModule = class StorageModule {
};
exports.StorageModule = StorageModule;
exports.StorageModule = StorageModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            storage_path_service_1.StoragePathService,
            profile_image_storage_service_1.ProfileImageStorageService,
            document_artifact_service_1.DocumentArtifactService,
        ],
        exports: [
            storage_path_service_1.StoragePathService,
            profile_image_storage_service_1.ProfileImageStorageService,
            document_artifact_service_1.DocumentArtifactService,
        ],
    })
], StorageModule);
//# sourceMappingURL=storage.module.js.map