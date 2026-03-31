import { PipeTransform } from '@nestjs/common';
export interface FileValidationOptions {
    required?: boolean;
    maxSizeBytes?: number;
    allowedMimes?: string[];
}
export declare class FileValidationPipe implements PipeTransform {
    private readonly opts;
    constructor(opts?: FileValidationOptions);
    transform(file: Express.Multer.File): Express.Multer.File | undefined;
}
