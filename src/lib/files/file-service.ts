import { browserFileService } from "@/lib/files/browser-file-service";
import { desktopFileService } from "@/lib/files/desktop-file-service";
import { isDesktopApp } from "@/lib/runtime/platform";

export type FilePayload = {
  blob: Blob;
  filename: string;
  contentType: string;
};

export interface FileService {
  open(file: FilePayload): Promise<void>;
  download(file: FilePayload): Promise<void>;
}

export function getFileService(): FileService {
  return isDesktopApp() ? desktopFileService : browserFileService;
}

export const appFileService: FileService = {
  open(file) {
    return getFileService().open(file);
  },
  download(file) {
    return getFileService().download(file);
  },
};
