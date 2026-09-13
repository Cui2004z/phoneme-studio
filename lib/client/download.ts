import { ClientError } from "./api";
export async function downloadSavedActivity(id: string, title: string) {
  const response = await fetch("/api/activities/" + id + "/html", {
    cache: "no-store",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new ClientError(
      result.error || "The saved activity could not be generated.",
    );
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download =
    (title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "phoneme-activity") + ".html";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
