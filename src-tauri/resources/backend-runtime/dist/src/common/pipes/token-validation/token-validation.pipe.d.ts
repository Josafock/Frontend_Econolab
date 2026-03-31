import { PipeTransform } from '@nestjs/common';
export declare class TokenValidationPipe implements PipeTransform<string, string> {
    private readonly regex;
    transform(value: string): string;
}
