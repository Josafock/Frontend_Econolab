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
exports.ProfileImageStorageService = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const storage_path_service_1 = require("./storage-path.service");
const IMAGE_EXTENSION_BY_MIME = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
};
let ProfileImageStorageService = class ProfileImageStorageService {
    configService;
    storagePaths;
    constructor(configService, storagePaths) {
        this.configService = configService;
        this.storagePaths = storagePaths;
    }
    get runtimeConfig() {
        return this.configService.getOrThrow('storage');
    }
    get mode() {
        return this.runtimeConfig.profileImageStorageMode;
    }
    getProfileImageExtension(mimeType) {
        return mimeType ? IMAGE_EXTENSION_BY_MIME[mimeType] ?? 'bin' : 'bin';
    }
    getProfileImageBasename(userId) {
        return `user-${String(userId).replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    }
    buildProfileImagePath(userId, mimeType) {
        const extension = this.getProfileImageExtension(mimeType);
        return (0, node_path_1.join)(this.storagePaths.profileImagesPath, `${this.getProfileImageBasename(userId)}.${extension}`);
    }
    getKnownProfileImagePaths(userId) {
        const basename = this.getProfileImageBasename(userId);
        return ['jpg', 'png', 'webp', 'bin'].map((extension) => (0, node_path_1.join)(this.storagePaths.profileImagesPath, `${basename}.${extension}`));
    }
    async deleteKnownProfileImageFiles(userId) {
        await Promise.all(this.getKnownProfileImagePaths(userId).map(async (path) => {
            try {
                await node_fs_1.promises.unlink(path);
            }
            catch {
            }
        }));
    }
    async storeProfileImage(user, file) {
        if (this.mode === 'filesystem') {
            this.storagePaths.ensureProfileImagesDirectory();
            await this.deleteKnownProfileImageFiles(user.id);
            const imagePath = this.buildProfileImagePath(user.id, file.mimetype);
            await node_fs_1.promises.writeFile(imagePath, file.buffer);
            user.profileImageData = null;
            user.profileImageMimeType = file.mimetype;
            return;
        }
        user.profileImageData = file.buffer.toString('base64');
        user.profileImageMimeType = file.mimetype;
    }
    async resolveProfileImageUrl(user) {
        if (this.mode === 'filesystem' && user.profileImageMimeType) {
            try {
                const filePath = this.buildProfileImagePath(user.id, user.profileImageMimeType);
                const buffer = await node_fs_1.promises.readFile(filePath);
                return `data:${user.profileImageMimeType};base64,${buffer.toString('base64')}`;
            }
            catch {
            }
        }
        if (user.profileImageData && user.profileImageMimeType) {
            return `data:${user.profileImageMimeType};base64,${user.profileImageData}`;
        }
        return user.googleAvatarUrl ?? null;
    }
};
exports.ProfileImageStorageService = ProfileImageStorageService;
exports.ProfileImageStorageService = ProfileImageStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        storage_path_service_1.StoragePathService])
], ProfileImageStorageService);
//# sourceMappingURL=profile-image-storage.service.js.map