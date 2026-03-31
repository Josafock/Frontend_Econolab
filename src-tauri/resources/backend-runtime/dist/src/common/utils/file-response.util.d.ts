import { Response } from 'express';
export declare function sendBufferResponse(response: Response, options: {
    contentType: string;
    filename: string;
    disposition?: 'inline' | 'attachment';
    buffer: Buffer;
}): void;
export declare function sendAttachmentFile(response: Response, filename: string, contentType: string, buffer: Buffer): void;
