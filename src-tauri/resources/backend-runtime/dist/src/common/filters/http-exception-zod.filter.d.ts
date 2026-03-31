import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
export declare class HttpExceptionZodFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void;
}
