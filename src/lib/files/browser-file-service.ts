import type { FilePayload, FileService } from "@/lib/files/file-service";

function createObjectUrl(file: FilePayload) {
  return URL.createObjectURL(
    file.blob.type ? file.blob : new Blob([file.blob], { type: file.contentType }),
  );
}

function releaseObjectUrl(url: string) {
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60_000);
}

class BrowserFileService implements FileService {
  async open(file: FilePayload): Promise<void> {
    const previewWindow = window.open("", "_blank");
    const url = createObjectUrl(file);

    if (previewWindow) {
      previewWindow.location.replace(url);
      releaseObjectUrl(url);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    releaseObjectUrl(url);
  }

  async download(file: FilePayload): Promise<void> {
    const url = createObjectUrl(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.filename;
    anchor.click();
    releaseObjectUrl(url);
  }
}

export const browserFileService = new BrowserFileService();
