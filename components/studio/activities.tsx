"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Pencil,
  Plus,
  FolderOpen,
  Grid3X3,
  PanelsTopLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell } from "./shell";
import { ErrorNotice, DeleteDialog } from "./forms";
import { api } from "@/lib/client/api";
import { downloadSavedActivity } from "@/lib/client/download";
import type { SavedActivity } from "@/lib/studio/data";
export function ActivitiesPage() {
  const [items, setItems] = useState<SavedActivity[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const refresh = useCallback(async () => {
    setItems(await api<SavedActivity[]>("/api/activities"));
    setError("");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void api<SavedActivity[]>("/api/activities", { signal: controller.signal })
      .then(setItems)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function download(item: SavedActivity) {
    setBusy(item.id);
    setError("");
    try {
      await downloadSavedActivity(item.id, item.config.title);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <Shell page="activities">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PREPARED ONCE. READY AGAIN.</p>
          <h1>Saved activities</h1>
          <p>
            Reopen, adapt or download activities from your classroom collection.
          </p>
        </div>
        <div className="form-actions">
          <Button asChild>
            <Link href="/wordle">
              <Plus size={16} />
              Wordle
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/word-search">
              <Plus size={16} />
              Word Search
            </Link>
          </Button>
        </div>
      </div>
      <ErrorNotice message={error} />
      {loading ? (
        <div className="content-panel" role="status">
          Loading saved activities…
        </div>
      ) : !items.length ? (
        <div className="content-panel empty-state">
          <FolderOpen size={32} />
          <h2>No saved activities yet</h2>
          <p>Open a builder and save your first activity.</p>
        </div>
      ) : (
        <div className="saved-grid">
          {items.map((item) => (
            <article className="content-panel saved-card" key={item.id}>
              <div className="card-title">
                <span
                  className={
                    "feature-icon " +
                    (item.config.type === "word-search" ? "green" : "")
                  }
                >
                  {item.config.type === "wordle" ? (
                    <PanelsTopLeft size={22} />
                  ) : (
                    <Grid3X3 size={22} />
                  )}
                </span>
                <span className="tag">
                  {item.config.type === "wordle" ? "Wordle" : "Word Search"}
                </span>
              </div>
              <h2>{item.config.title}</h2>
              <p>{item.config.instructions}</p>
              <dl>
                <div>
                  <dt>Word list</dt>
                  <dd>{item.listName}</dd>
                </div>
                <div>
                  <dt>Difficulty</dt>
                  <dd>{item.config.difficulty}</dd>
                </div>
                <div>
                  <dt>Last saved</dt>
                  <dd>{new Date(item.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
              <div className="form-actions">
                <Button variant="outline" asChild>
                  <Link href={"/" + item.config.type + "?activity=" + item.id}>
                    <Pencil size={15} />
                    Edit
                  </Link>
                </Button>
                <Button
                  disabled={busy === item.id}
                  onClick={() => void download(item)}
                >
                  <Download size={15} />
                  {busy === item.id ? "Generating…" : "Download HTML"}
                </Button>
                <DeleteDialog
                  label={item.config.title}
                  description="Delete this saved configuration? Your word list and previously downloaded files will remain."
                  onDelete={async () => {
                    await api("/api/activities/" + item.id, {
                      method: "DELETE",
                    });
                    await refresh();
                  }}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}
