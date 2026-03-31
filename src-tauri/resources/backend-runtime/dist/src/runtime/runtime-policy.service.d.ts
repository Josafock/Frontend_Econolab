import { ConfigService } from '@nestjs/config';
import { type AppRuntimeMode } from '../config/app.config';
export declare class RuntimePolicyService {
    private readonly configService;
    constructor(configService: ConfigService);
    private get runtimeConfig();
    get runtimeMode(): AppRuntimeMode;
    get allowHardDelete(): boolean;
    assertHardDeleteAllowed(resourceLabel?: string): void;
}
