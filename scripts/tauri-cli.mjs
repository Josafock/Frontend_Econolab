import { spawn } from "node:child_process";
import path from "node:path";

const cargoBin = path.join(process.env.USERPROFILE || "", ".cargo", "bin");
const env = {
  ...process.env,
  PATH: cargoBin ? `${cargoBin};${process.env.PATH || ""}` : process.env.PATH,
};

const tauriEntrypoint = path.join(
  process.cwd(),
  "node_modules",
  "@tauri-apps",
  "cli",
  "tauri.js",
);

const child = spawn(process.execPath, [tauriEntrypoint, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: "inherit",
  env,
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
