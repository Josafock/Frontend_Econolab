import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

for (const relativePath of [".next", "out"]) {
  rmSync(path.join(process.cwd(), relativePath), {
    recursive: true,
    force: true,
  });
}

const command = process.platform === "win32" ? "npm.cmd" : "npm";

const child = spawn(command, ["run", "build"], {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    ECONOLAB_DESKTOP_EXPORT: "true",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
