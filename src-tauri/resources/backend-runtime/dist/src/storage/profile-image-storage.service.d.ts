import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { type ProfileImageStorageMode } from '../config/storage.config';
import { StoragePathService } from './storage-path.service';
export declare class ProfileImageStorageService {
    private readonly configService;
    private readonly storagePaths;
    constructor(configService: ConfigService, storagePaths: StoragePathService);
    private get runtimeConfig();
    get mode(): ProfileImageStorageMode;
    private getProfileImageExtension;
    private getProfileImageBasename;
    private buildProfileImagePath;
    private getKnownProfileImagePaths;
    private deleteKnownProfileImageFiles;
    storeProfileImage(user: User, file: Express.Multer.File): Promise<void>;
    resolveProfileImageUrl(user: User): Promise<string | null>;
}
