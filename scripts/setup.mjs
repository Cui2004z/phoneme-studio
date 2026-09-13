import { existsSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
if (!existsSync(".env")) copyFileSync(".env.example", ".env");
if (!process.env.DATABASE_URL) process.loadEnvFile(".env");
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["prisma/seed.mjs"],
]) {
  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
