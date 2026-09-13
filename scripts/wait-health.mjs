const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
for (let i = 0; i < 90; i++) {
  try {
    const response = await fetch(base + "/health", {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      console.log("Health: 200 OK");
      process.exit(0);
    }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.error("The application did not become healthy.");
process.exit(1);
