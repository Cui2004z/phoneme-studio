import test from "node:test";
import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL;
if (!base)
  throw new Error(
    "Run npm test, or set TEST_BASE_URL before npm run test:api.",
  );
async function request(path, method = "GET", value, expected = 200) {
  const response = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", Origin: base },
    body: value === undefined ? undefined : JSON.stringify(value),
  });
  const result = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result;
}
function activity(list, word, type = "wordle", words = []) {
  return {
    type,
    title: "Classroom activity",
    instructions: "Listen to the sounds.",
    difficulty: "standard",
    hints: true,
    labels: true,
    theme: "light",
    seed: 42,
    listId: list.id,
    wordId: type === "wordle" ? word.id : "",
    wordIds: words.map((w) => w.id),
    rows: 10,
    cols: 10,
  };
}
function payload(html) {
  const start = html.indexOf(')({"config":');
  assert.ok(start >= 0, "Standalone game has an embedded data payload.");
  let quoted = false,
    escaped = false,
    depth = 0;
  for (let i = start + 2; i < html.length; i++) {
    const c = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0)
      return JSON.parse(html.slice(start + 2, i + 1));
  }
  throw new Error("Invalid embedded JSON");
}
test("database-backed classroom workflow", async (t) => {
  let list, other, word, word2, wordle, search, custom;
  try {
    await t.test("health checks a migrated database", async () => {
      assert.equal((await request("/health")).database, "connected");
    });
    const catalog = await request("/api/catalog");
    assert.equal(catalog.phonemes.length >= 43, true);
    assert.equal(catalog.difficulties.length, 3);
    await t.test("create, read and update a word list", async () => {
      list = await request(
        "/api/lists",
        "POST",
        {
          name: "Integration test " + Date.now(),
          description: "A temporary list",
        },
        201,
      );
      list = await request("/api/lists/" + list.id, "PUT", {
        name: list.name,
        description: "Edited description",
      });
      assert.equal(
        (await request("/api/lists/" + list.id)).description,
        "Edited description",
      );
      other = await request(
        "/api/lists",
        "POST",
        { name: "Another temporary list", description: "" },
        201,
      );
    });
    await t.test("reject malformed, empty and unknown phonemes", async () => {
      for (const phonemes of [
        [],
        ["θɪn"],
        ["<script>"],
        ["θ", "missing"],
        "θ ɪ n",
      ])
        await request(
          "/api/lists/" + list.id + "/words",
          "POST",
          { english: "thin", phonemes, hint: "" },
          400,
        );
      const response = await fetch(base + "/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{",
      });
      assert.equal(response.status, 400);
      const oversized = await fetch(base + "/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x".repeat(40000) }),
      });
      assert.equal(oversized.status, 413);
      const cross = await fetch(base + "/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://unrelated.example",
        },
        body: JSON.stringify({ name: "blocked" }),
      });
      assert.equal(cross.status, 403);
    });
    await t.test(
      "word CRUD preserves multi-character token boundaries and hints",
      async () => {
        word = await request(
          "/api/lists/" + list.id + "/words",
          "POST",
          {
            english: "chin",
            phonemes: ["tʃ", "ɪ", "n"],
            hint: "Point to the bottom of your face.",
          },
          201,
        );
        assert.deepEqual((await request("/api/words/" + word.id)).phonemes, [
          "tʃ",
          "ɪ",
          "n",
        ]);
        word2 = await request(
          "/api/lists/" + list.id + "/words",
          "POST",
          {
            english: "train",
            phonemes: ["t", "ɹ", "æɪ", "n"],
            hint: "It travels on rails.",
          },
          201,
        );
        await request(
          "/api/lists/" + list.id + "/words",
          "POST",
          { english: "CHIN", phonemes: ["tʃ", "ɪ", "n"], hint: "" },
          409,
        );
        word = await request("/api/words/" + word.id, "PUT", {
          english: "chin",
          phonemes: ["tʃ", "ɪ", "n"],
          hint: "An edited hint.",
        });
        assert.equal(word.hint, "An edited hint.");
      },
    );
    await t.test("create and update a custom phoneme", async () => {
      custom = await request(
        "/api/phonemes",
        "POST",
        { symbol: "ɬ", label: "LL", example: "Welsh ll", kind: "consonant" },
        201,
      );
      custom = await request("/api/phonemes/" + custom.id, "PUT", {
        symbol: "ɬ",
        label: "LL",
        example: "a voiceless lateral sound",
        kind: "consonant",
      });
      assert.equal((await request("/api/phonemes/" + custom.id)).label, "LL");
    });
    await t.test(
      "saved activities reject foreign words and unsupported settings",
      async () => {
        await request("/api/activities", "POST", activity(other, word), 400);
        await request(
          "/api/activities",
          "POST",
          { ...activity(list, word), difficulty: "impossible" },
          400,
        );
        await request(
          "/api/activities",
          "POST",
          { ...activity(list, word), rows: 100 },
          400,
        );
        await request(
          "/api/activities",
          "POST",
          { ...activity(list, word, "word-search", [word, word]) },
          400,
        );
      },
    );
    await t.test("create and retrieve both activity types", async () => {
      wordle = await request(
        "/api/activities",
        "POST",
        activity(list, word),
        201,
      );
      search = await request(
        "/api/activities",
        "POST",
        activity(list, word, "word-search", [word, word2]),
        201,
      );
      assert.equal(
        (await request("/api/activities/" + wordle.id)).config.wordId,
        word.id,
      );
      assert.deepEqual(
        (await request("/api/activities/" + search.id)).config.wordIds,
        [word.id, word2.id],
      );
    });
    await t.test(
      "exports use saved settings and current stored words",
      async () => {
        wordle = await request("/api/activities/" + wordle.id, "PUT", {
          ...wordle.config,
          title: "Updated <title> </script><script>alert(1)</script>",
          theme: "dark",
          difficulty: "gentle",
        });
        const response = await fetch(
          base + "/api/activities/" + wordle.id + "/html",
        );
        assert.equal(response.status, 200);
        assert.match(response.headers.get("content-disposition"), /attachment/);
        const html = await response.text();
        const data = payload(html);
        assert.equal(data.config.theme, "dark");
        assert.equal(data.attempts, 8);
        assert.equal(data.target.hint, "An edited hint.");
        assert.deepEqual(data.target.phonemes, ["tʃ", "ɪ", "n"]);
        assert.equal((html.match(/<script>/g) || []).length, 1);
        assert.equal(
          html.includes("</script><script>alert(1)</script>"),
          false,
        );
        assert.equal(/<script[^>]+src=|<link[^>]+href=/.test(html), false);
        const searchHtml = await (
          await fetch(base + "/api/activities/" + search.id + "/html")
        ).text();
        const p = payload(searchHtml);
        assert.equal(p.puzzle.placements.length, 2);
        for (const placement of p.puzzle.placements)
          assert.deepEqual(
            placement.cells.map((i) => p.puzzle.grid[i]),
            p.words[placement.wordIndex].phonemes,
          );
      },
    );
    await t.test(
      "protect referenced content and roll back invalid edits",
      async () => {
        await request("/api/words/" + word.id, "DELETE", undefined, 409);
        await request("/api/lists/" + list.id, "DELETE", undefined, 409);
        const sound = catalog.phonemes.find((p) => p.symbol === "tʃ");
        await request("/api/phonemes/" + sound.id, "DELETE", undefined, 409);
        await request(
          "/api/words/" + word.id,
          "PUT",
          { english: "chin", phonemes: Array(9).fill("n"), hint: "" },
          400,
        );
        assert.deepEqual((await request("/api/words/" + word.id)).phonemes, [
          "tʃ",
          "ɪ",
          "n",
        ]);
      },
    );
    await t.test(
      "delete configurations, words, phonemes and lists",
      async () => {
        await request("/api/activities/" + wordle.id, "DELETE", undefined, 204);
        wordle = null;
        await request("/api/activities/" + search.id, "DELETE", undefined, 204);
        search = null;
        await request("/api/words/" + word.id, "DELETE", undefined, 204);
        await request("/api/words/" + word.id, "GET", undefined, 404);
        word = null;
        await request("/api/phonemes/" + custom.id, "DELETE", undefined, 204);
        custom = null;
        await request("/api/lists/" + list.id, "DELETE", undefined, 204);
        list = null;
        await request("/api/lists/" + other.id, "DELETE", undefined, 204);
        other = null;
      },
    );
  } finally {
    for (const item of [wordle, search])
      if (item)
        await request(
          "/api/activities/" + item.id,
          "DELETE",
          undefined,
          204,
        ).catch(() => {});
    for (const item of [list, other])
      if (item)
        await request("/api/lists/" + item.id, "DELETE", undefined, 204).catch(
          () => {},
        );
    if (custom)
      await request(
        "/api/phonemes/" + custom.id,
        "DELETE",
        undefined,
        204,
      ).catch(() => {});
  }
});
