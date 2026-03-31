import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const cargoBin = path.join(process.env.USERPROFILE || "", ".cargo", "bin");
const env = {
  ...process.env,
  PATH: cargoBin ? `${cargoBin};${process.env.PATH || ""}` : process.env.PATH,
};

const backendPort = process.env.ECONOLAB_BACKEND_PORT || "3000";
const frontendPort = process.env.PORT || "5173";

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port: Number(port), host });

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      resolve(false);
    });
  });
}

async function waitForPort(port, host = "127.0.0.1", timeoutMs = 60000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (await isPortOpen(port, host)) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  return false;
}

function killChild(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      shell: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

let tauriProcess = null;

const helperProcess = spawn(
  process.execPath,
  [path.join(process.cwd(), "scripts", "tauri-dev.mjs"), "--auto-sync"],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
    shell: false,
  },
);

const shutdown = () => {
  killChild(tauriProcess);
  killChild(helperProcess);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", shutdown);

helperProcess.on("exit", (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});

const backendReady = await waitForPort(backendPort);
const frontendReady = await waitForPort(frontendPort);

if (!backendReady || !frontendReady) {
  console.error(
    `No se pudieron preparar los servicios locales para Tauri auto-sync. Backend listo: ${backendReady}. Frontend listo: ${frontendReady}.`,
  );
  shutdown();
  process.exit(1);
}

const tauriEntrypoint = path.join(
  process.cwd(),
  "node_modules",
  "@tauri-apps",
  "cli",
  "tauri.js",
);

tauriProcess = spawn(
  process.execPath,
  [tauriEntrypoint, "dev", "-c", "src-tauri/tauri.auto.conf.json"],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
    shell: false,
  },
);

tauriProcess.on("exit", (code, signal) => {
  shutdown();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
