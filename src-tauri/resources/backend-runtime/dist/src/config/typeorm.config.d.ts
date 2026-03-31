import { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare const typeOrmConfig: (configService: ConfigService) => TypeOrmModuleOptions;
