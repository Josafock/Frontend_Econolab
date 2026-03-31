import { ConfigService } from '@nestjs/config';
export declare class StoragePathService {
    private readonly configService;
    constructor(configService: ConfigService);
    private get runtimeConfig();
    get rootPath(): string;
    get profileImagesPath(): string;
    get documentArtifactsPath(): string;
    ensureDirectory(path: string): string;
    ensureProfileImagesDirectory(): string;
    ensureDocumentArtifactsDirectory(subdirectory?: string): string;
}
