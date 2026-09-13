import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
const directory = await mkdtemp(join(tmpdir(), "phoneme-test-"));
const database = "file:" + join(directory, "test.db");
const env = {
  ...process.env,
  DATABASE_URL: database,
  NEXT_TELEMETRY_DISABLED: "1",
};
let child;
try {
  for (const args of [
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    ["prisma/seed.mjs"],
  ]) {
    const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
    if (result.status !== 0) throw new Error("Test database setup failed.");
  }
  const probe = net.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const url = "http://127.0.0.1:" + port;
  child = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "dev",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk;
  });
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });
  let ready = false;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error("Test server exited: " + log);
    try {
      const response = await fetch(url + "/health", {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("Test server did not start: " + log);
  const result = spawnSync(process.execPath, ["--test", "tests/api.test.mjs"], {
    env: { ...env, TEST_BASE_URL: url },
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("API integration checks failed.");
  // Seeding after normal use must neither duplicate nor resurrect deleted data.
  const before = await (await fetch(url + "/api/lists")).json();
  const seed = spawnSync(process.execPath, ["prisma/seed.mjs"], {
    env,
    stdio: "inherit",
  });
  const after = await (await fetch(url + "/api/lists")).json();
  if (seed.status !== 0 || JSON.stringify(before) !== JSON.stringify(after))
    throw new Error("Seeding changed existing content.");
  console.log("Seed idempotency verified.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) {
    child.kill("SIGTERM");
    await new Promise((resolve) => {
      child.once("exit", resolve);
      setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 5000).unref();
    });
  }
  await rm(directory, { recursive: true, force: true });
}
