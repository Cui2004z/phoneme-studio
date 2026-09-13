import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const path = "artifacts/persistence.json";
if (process.argv[2] === "create") {
  const response = await fetch(base + "/api/lists", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      name: "Docker persistence check",
      description: "This list must survive a container restart.",
    }),
  });
  assert.equal(response.status, 201);
  const list = await response.json();
  await mkdir("artifacts", { recursive: true });
  await writeFile(path, JSON.stringify({ id: list.id, name: list.name }));
  console.log("Saved a database record before restart.");
} else if (process.argv[2] === "verify") {
  const expected = JSON.parse(await readFile(path, "utf8"));
  const response = await fetch(base + "/api/lists/" + expected.id);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).name, expected.name);
  assert.equal(
    (
      await fetch(base + "/api/lists/" + expected.id, {
        method: "DELETE",
        headers: { Origin: base },
      })
    ).status,
    204,
  );
  await unlink(path);
  console.log("Database persistence across container restart verified.");
} else throw new Error("Use create or verify.");
