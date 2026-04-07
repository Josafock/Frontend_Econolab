import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";

const frontendDir = path.resolve(process.cwd());
const backendDir = path.resolve(frontendDir, "..", "backend");
const backendPort = process.env.ECONOLAB_BACKEND_PORT || "3000";
const frontendPort = process.env.PORT || "5173";
const autoSyncPreset = process.argv.includes("--auto-sync");

function defaultDesktopSqlitePath() {
  if (process.env.DATABASE_SQLITE_PATH?.trim()) {
    return process.env.DATABASE_SQLITE_PATH.trim();
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA;

    if (localAppData) {
      return path.join(
        localAppData,
        "Econolab",
        "backend",
        "econolab-tauri-dev.sqlite",
      );
    }
  }

  return "data/econolab-tauri-dev.sqlite";
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

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

async function logBackendSyncStatus(baseUrl, machineToken) {
  if (!baseUrl || !machineToken) {
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/sync/status`, {
      headers: {
        "x-sync-token": machineToken,
      },
    });

    if (!response.ok) {
      console.warn(
        `No se pudo leer el estado de sync del backend local (${response.status}).`,
      );
      return;
    }

    const status = await response.json();
    console.log(
      `Backend local sync -> auto: ${status.autoEnabled ? "on" : "off"} · remoto: ${status.remoteBaseUrlConfigured ? "configurado" : "sin configurar"} · intervalo: ${status.autoIntervalSeconds}s`,
    );
  } catch (error) {
    console.warn(
      `No se pudo verificar el estado de sync del backend local: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function waitForPortToClose(port, host = "127.0.0.1", timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!(await isPortOpen(port, host))) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
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

function killProcessOnPort(port) {
  if (process.platform === "win32") {
    const netstat = spawnSync("netstat", ["-ano", "-p", "tcp"], {
      encoding: "utf-8",
      shell: false,
    });

    const pids = new Set(
      (netstat.stdout || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.includes(`:${port}`) &&
            line.includes("LISTENING"),
        )
        .map((line) => line.split(/\s+/).at(-1))
        .filter((value) => value && /^\d+$/.test(value)),
    );

    for (const pid of pids) {
      spawnSync("taskkill", ["/PID", pid, "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
    }

    return pids.size > 0;
  }

  const lookup = spawnSync("lsof", ["-ti", `tcp:${port}`], {
    encoding: "utf-8",
    shell: false,
  });

  const pids = (lookup.stdout || "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));

  for (const pid of pids) {
    spawnSync("kill", ["-9", pid], {
      stdio: "ignore",
      shell: false,
    });
  }

  return pids.length > 0;
}

async function main() {
  const sqliteDatabasePath = defaultDesktopSqlitePath();
  const syncRemoteBaseUrl =
    process.env.SYNC_REMOTE_BASE_URL ||
    (autoSyncPreset ? "http://127.0.0.1:3001/api" : undefined);
  const syncMachineToken =
    process.env.SYNC_MACHINE_TOKEN ||
    (autoSyncPreset ? "econolab-sync-secret" : undefined);
  const syncAutoEnabled =
    process.env.SYNC_AUTO_ENABLED || (autoSyncPreset ? "true" : undefined);
  const syncAutoIntervalSeconds =
    process.env.SYNC_AUTO_INTERVAL_SECONDS || (autoSyncPreset ? "10" : undefined);

  const backendEnv = {
    ...process.env,
    APP_RUNTIME_MODE: process.env.APP_RUNTIME_MODE || "desktop-offline",
    DATABASE_TYPE: process.env.DATABASE_TYPE || "sqlite",
    DATABASE_SQLITE_PATH: sqliteDatabasePath,
    DATABASE_SYNCHRONIZE: process.env.DATABASE_SYNCHRONIZE || "false",
    DATABASE_LOGGING: process.env.DATABASE_LOGGING || "false",
    PORT: backendPort,
    SYNC_REMOTE_BASE_URL: syncRemoteBaseUrl,
    SYNC_MACHINE_TOKEN: syncMachineToken,
    SYNC_AUTO_ENABLED: syncAutoEnabled,
    SYNC_AUTO_INTERVAL_SECONDS: syncAutoIntervalSeconds,
    APP_CORS_ORIGINS:
      process.env.APP_CORS_ORIGINS || `http://localhost:${frontendPort}`,
  };

  const frontendEnv = {
    ...process.env,
    NEXT_PUBLIC_DESKTOP_API_URL:
      process.env.NEXT_PUBLIC_DESKTOP_API_URL ||
      `http://127.0.0.1:${backendPort}/api`,
  };

  let backendProcess = null;
  const forceRestartBackend =
    process.env.ECONOLAB_FORCE_RESTART_BACKEND === "true" || autoSyncPreset;
  const backendAlreadyRunning = await isPortOpen(backendPort);
  const sqlitePath = path.resolve(
    backendDir,
    backendEnv.DATABASE_SQLITE_PATH || sqliteDatabasePath,
  );

  if (backendAlreadyRunning && forceRestartBackend) {
    console.log(
      `Reiniciando backend local en el puerto ${backendPort} para aplicar la configuracion actual...`,
    );
    killProcessOnPort(backendPort);

    const closed = await waitForPortToClose(backendPort);
    if (!closed) {
      console.error(
        `No se pudo liberar el puerto ${backendPort} para reiniciar el backend local.`,
      );
      process.exit(1);
    }
  }

  if (autoSyncPreset) {
    console.log(
      `Desktop auto-sync activo -> remoto: ${syncRemoteBaseUrl || "sin configurar"} · intervalo: ${syncAutoIntervalSeconds || "10"}s`,
    );
  }

  const backendRunningAfterRestart = await isPortOpen(backendPort);

  if (!backendRunningAfterRestart) {
    const backendBootstrapScript =
      backendEnv.DATABASE_TYPE === "sqlite"
        ? existsSync(sqlitePath)
          ? ["run", "migration:run"]
          : ["run", "db:sqlite:init"]
        : ["run", "migration:run"];

    const initResult = spawnSync(npmCommand(), backendBootstrapScript, {
      cwd: backendDir,
      env: backendEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    if (initResult.status !== 0) {
      process.exit(initResult.status ?? 1);
    }

    backendProcess = spawn(npmCommand(), ["run", "start:dev"], {
      cwd: backendDir,
      env: backendEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    const backendReady = await waitForPort(backendPort);
    if (!backendReady) {
      console.error(
        `Backend local no quedo disponible en el puerto ${backendPort}.`,
      );
      killChild(backendProcess);
      process.exit(1);
    }
  } else {
    const backendReady = await waitForPort(backendPort, "127.0.0.1", 5000);
    if (!backendReady) {
      console.error(
        `Se detecto backend previo, pero no responde correctamente en el puerto ${backendPort}.`,
      );
      process.exit(1);
    }
  }

  await logBackendSyncStatus(
    `http://127.0.0.1:${backendPort}/api`,
    backendEnv.SYNC_MACHINE_TOKEN,
  );

  const frontendAlreadyRunning = await isPortOpen(frontendPort);
  let frontendProcess = null;

  if (frontendAlreadyRunning) {
    console.log(
      `Frontend detectado en el puerto ${frontendPort}. Se reutilizara el servidor existente.`,
    );
  } else {
    frontendProcess = spawn(npmCommand(), ["run", "dev"], {
      cwd: frontendDir,
      env: frontendEnv,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
  }

  const shutdown = () => {
    killChild(frontendProcess);
    killChild(backendProcess);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", shutdown);

  if (frontendProcess) {
    frontendProcess.on("exit", (code) => {
      shutdown();
      process.exit(code ?? 0);
    });
  }

  if (backendProcess) {
    backendProcess.on("exit", (code) => {
      if (code && code !== 0) {
        console.error(`Backend local finalizo con codigo ${code}.`);
      }
    });
  }

  if (!frontendProcess) {
    setInterval(() => {}, 60_000);
  }
}

void main();
