export type ProfileImageStorageMode = 'database' | 'filesystem';
export type DocumentOutputMode = 'response' | 'filesystem';
export declare function getStorageRuntimeConfig(env?: NodeJS.ProcessEnv): {
    rootPath: string;
    runtimeMode: import("./app.config").AppRuntimeMode;
    profileImageStorageMode: ProfileImageStorageMode;
    documentOutputMode: DocumentOutputMode;
    profileImagesPath: string;
    documentArtifactsPath: string;
};
export type StorageRuntimeConfig = ReturnType<typeof getStorageRuntimeConfig>;
export declare const storageConfig: (() => {
    rootPath: string;
    runtimeMode: import("./app.config").AppRuntimeMode;
    profileImageStorageMode: ProfileImageStorageMode;
    documentOutputMode: DocumentOutputMode;
    profileImagesPath: string;
    documentArtifactsPath: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    rootPath: string;
    runtimeMode: import("./app.config").AppRuntimeMode;
    profileImageStorageMode: ProfileImageStorageMode;
    documentOutputMode: DocumentOutputMode;
    profileImagesPath: string;
    documentArtifactsPath: string;
}>;
