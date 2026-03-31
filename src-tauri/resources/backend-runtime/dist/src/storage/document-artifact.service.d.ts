import { StoragePathService } from './storage-path.service';
export declare class DocumentArtifactService {
    private readonly storagePaths;
    constructor(storagePaths: StoragePathService);
    private sanitizeToken;
    buildPdfFilename(prefix: string, identifier: string | number): string;
    buildCsvFilename(prefix: string, identifier: string | number): string;
    getDocumentArtifactsDirectory(subdirectory?: string): string;
}
