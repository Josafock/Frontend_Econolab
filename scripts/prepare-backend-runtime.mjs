import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import path from "node:path";

const frontendDir = process.cwd();
const backendDir = path.resolve(frontendDir, "..", "backend");
const resourcesDir = path.resolve(frontendDir, "src-tauri", "resources");
const runtimeDir = path.resolve(resourcesDir, "backend-runtime");
const nodeDir = path.resolve(resourcesDir, "node");
const nodeExecutableName = process.platform === "win32" ? "node.exe" : "node";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(runtimeDir, { recursive: true, force: true });
rmSync(nodeDir, { recursive: true, force: true });

run(npmCommand, ["run", "build"], backendDir);

mkdirSync(runtimeDir, { recursive: true });
mkdirSync(nodeDir, { recursive: true });

cpSync(path.join(backendDir, "dist"), path.join(runtimeDir, "dist"), {
  recursive: true,
});
cpSync(path.join(backendDir, "node_modules"), path.join(runtimeDir, "node_modules"), {
  recursive: true,
});

for (const filename of ["package.json", "package-lock.json"]) {
  const source = path.join(backendDir, filename);
  if (existsSync(source)) {
    copyFileSync(source, path.join(runtimeDir, filename));
  }
}

const logoSource = path.join(backendDir, "src", "public", "logoeco.png");
if (existsSync(logoSource)) {
  mkdirSync(path.join(runtimeDir, "public"), { recursive: true });
  copyFileSync(logoSource, path.join(runtimeDir, "public", "logoeco.png"));
}

copyFileSync(process.execPath, path.join(nodeDir, nodeExecutableName));

run(npmCommand, ["prune", "--omit=dev"], runtimeDir);
