import { browserFileService } from "@/lib/files/browser-file-service";
import type { FilePayload, FileService } from "@/lib/files/file-service";
import { saveDesktopFile } from "@/lib/runtime/tauri-bridge";

class DesktopFileService implements FileService {
  async open(file: FilePayload): Promise<void> {
    const saved = await saveDesktopFile(file, { openAfterSave: true });
    if (saved) {
      return;
    }

    await browserFileService.open(file);
  }

  async download(file: FilePayload): Promise<void> {
    const saved = await saveDesktopFile(file, { openAfterSave: false });
    if (saved) {
      return;
    }

    await browserFileService.download(file);
  }
}

export const desktopFileService = new DesktopFileService();
