#!/usr/bin/env node
import { execSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOOL_DIR = join(__dirname, "../.foundry");
const FORGE_BIN = join(TOOL_DIR, "forge");

function getPlatform() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    return arch === "x64" ? "foundry_nightly_windows_amd64.tar.gz" : null;
  }
  if (platform === "linux") {
    return arch === "x64" ? "foundry_nightly_linux_amd64.tar.gz" : null;
  }
  if (platform === "darwin") {
    return arch === "x64"
      ? "foundry_nightly_darwin_amd64.tar.gz"
      : arch === "arm64"
        ? "foundry_nightly_darwin_arm64.tar.gz"
        : null;
  }
  return null;
}

function downloadForge() {
  console.log("Downloading Foundry forge binary...");

  const archive = join(TOOL_DIR, "foundry.tar.gz");
  const platform = getPlatform();

  if (!platform) {
    throw new Error(
      `Unsupported platform: ${process.platform}/${process.arch}`
    );
  }

  const url = `https://github.com/foundry-rs/foundry/releases/download/nightly/${platform}`;

  mkdirSync(TOOL_DIR, { recursive: true });

  const curlCmd =
    process.platform === "win32"
      ? `curl -L "${url}" -o "${archive}"`
      : `curl -L '${url}' -o '${archive}'`;
  const tarCmd =
    process.platform === "win32"
      ? `tar -xzf "${archive}" -C "${TOOL_DIR}"`
      : `tar -xzf '${archive}' -C '${TOOL_DIR}'`;

  try {
    execSync(curlCmd, { stdio: "inherit", shell: true });
    execSync(tarCmd, { stdio: "inherit", shell: true });
  } catch {
    console.error("Download failed. Make sure curl is installed.");
    process.exit(1);
  }

  chmodSync(FORGE_BIN, "755");
  console.log("Foundry installed successfully!");
}

function getForge() {
  if (!existsSync(FORGE_BIN)) {
    downloadForge();
  }
  return FORGE_BIN;
}

function runForge(args) {
  const forge = getForge();
  const srcDir = join(__dirname, "../src");

  const cmd =
    process.platform === "win32"
      ? `"${forge}" ${args.map((a) => `"${a}"`).join(" ")}`
      : `'${forge}' ${args.join(" ")}`;

  execSync(cmd, {
    cwd: srcDir,
    stdio: "inherit",
    env: { ...process.env },
    shell: true,
  });
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: node scripts/deploy.js <forge-args>");
  console.log(
    "Example: node scripts/deploy.js script/Deploy.s.sol:DeployScript --rpc-url https://api.avax-test.network/ext/bc/C/rpc --broadcast"
  );
  process.exit(1);
}

runForge(args);
