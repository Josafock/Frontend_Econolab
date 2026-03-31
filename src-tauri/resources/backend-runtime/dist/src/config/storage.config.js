"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
exports.getStorageRuntimeConfig = getStorageRuntimeConfig;
const config_1 = require("@nestjs/config");
const node_path_1 = require("node:path");
const app_config_1 = require("./app.config");
function normalizeProfileImageStorageMode(value, runtimeMode) {
    const normalized = value?.trim().toLowerCase();
    if (normalized === 'database') {
        return 'database';
    }
    if (normalized === 'filesystem') {
        return 'filesystem';
    }
    return runtimeMode === 'web-online' ? 'database' : 'filesystem';
}
function normalizeDocumentOutputMode(value) {
    return value?.trim().toLowerCase() === 'filesystem'
        ? 'filesystem'
        : 'response';
}
function getStorageRuntimeConfig(env = process.env) {
    const { runtimeMode } = (0, app_config_1.getAppRuntimeConfig)(env);
    const rootPath = (0, node_path_1.resolve)(process.cwd(), env.APP_STORAGE_ROOT?.trim() || 'data/storage');
    return {
        rootPath,
        runtimeMode,
        profileImageStorageMode: normalizeProfileImageStorageMode(env.APP_PROFILE_IMAGE_STORAGE_MODE, runtimeMode),
        documentOutputMode: normalizeDocumentOutputMode(env.APP_DOCUMENT_OUTPUT_MODE),
        profileImagesPath: (0, node_path_1.resolve)(rootPath, 'profile-images'),
        documentArtifactsPath: (0, node_path_1.resolve)(rootPath, 'documents'),
    };
}
exports.storageConfig = (0, config_1.registerAs)('storage', () => getStorageRuntimeConfig());
//# sourceMappingURL=storage.config.js.map