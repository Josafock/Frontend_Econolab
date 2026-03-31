import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
export declare function validationExceptionFactory(errors: ValidationError[]): BadRequestException;
