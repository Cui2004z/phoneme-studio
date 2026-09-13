"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Plus, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shell } from "./shell";
import { ErrorNotice, DeleteDialog, Field } from "./forms";
import { ListEditor, WordEditor, PhonemeEditor } from "./library-editors";
import { api } from "@/lib/client/api";
import type {
  Catalog,
  WordListSummary,
  WordListDetail,
  StoredWord,
  StoredPhoneme,
} from "@/lib/studio/data";

export function LibraryPage() {
  const [catalog, setCatalog] = useState<Catalog>({
      phonemes: [],
      difficulties: [],
    }),
    [lists, setLists] = useState<WordListSummary[]>([]);
  const [selected, setSelected] = useState(""),
    [detail, setDetail] = useState<WordListDetail | null>(null);
  const [loading, setLoading] = useState(true),
    [loadedKey, setLoadedKey] = useState(""),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [revision, setRevision] = useState(0);
  const [listEditor, setListEditor] = useState<WordListSummary | "new" | null>(
      null,
    ),
    [wordEditor, setWordEditor] = useState<StoredWord | "new" | null>(null),
    [phonemeEditor, setPhonemeEditor] = useState<StoredPhoneme | "new" | null>(
      null,
    );
  const refresh = useCallback(async () => {
    const [nextCatalog, nextLists] = await Promise.all([
      api<Catalog>("/api/catalog"),
      api<WordListSummary[]>("/api/lists"),
    ]);
    setCatalog(nextCatalog);
    setLists(nextLists);
    setSelected((id) =>
      nextLists.some((l) => l.id === id) ? id : (nextLists[0]?.id ?? ""),
    );
    setRevision((v) => v + 1);
    setError("");
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void Promise.all([
      api<Catalog>("/api/catalog", { signal: controller.signal }),
      api<WordListSummary[]>("/api/lists", { signal: controller.signal }),
    ])
      .then(([nextCatalog, nextLists]) => {
        setCatalog(nextCatalog);
        setLists(nextLists);
        setSelected(nextLists[0]?.id ?? "");
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!selected) return;
    const controller = new AbortController();
    void api<WordListDetail>("/api/lists/" + selected, {
      signal: controller.signal,
    })
      .then((d) => {
        if (!controller.signal.aborted) setDetail(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedKey(selected + ":" + revision);
      });
    return () => controller.abort();
  }, [selected, revision]);
  async function remove(path: string) {
    await api(path, { method: "DELETE" });
    await refresh();
    toast.success("Deleted.");
  }
  const wordLoading = Boolean(
    selected && loadedKey !== selected + ":" + revision,
  );
  const shown =
    detail?.words.filter(
      (w) =>
        w.english.toLowerCase().includes(query.toLowerCase()) ||
        w.phonemes.join("").includes(query),
    ) ?? [];
  return (
    <Shell page="library">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LIBRARY THAT GROWS WITH YOUR CLASS</p>
          <h1>Your words & sounds</h1>
          <p>
            Create word lists, keep phonemes together, and shape the hints
            students see.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void refresh().catch((e) => setError(e.message))}
        >
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>
      <ErrorNotice message={error} />
      {loading ? (
        <div className="content-panel" role="status">
          Loading your library…
        </div>
      ) : (
        <Tabs defaultValue="lists">
          <TabsList className="library-tabs">
            <TabsTrigger value="lists">
              Word lists <span className="tab-count">{lists.length}</span>
            </TabsTrigger>
            <TabsTrigger value="phonemes">
              Phoneme library{" "}
              <span className="tab-count">{catalog.phonemes.length}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="lists">
            <div className="library-layout">
              <aside className="content-panel list-sidebar">
                <div className="section-heading">
                  <h2>Word lists</h2>
                  <Button size="sm" onClick={() => setListEditor("new")}>
                    <Plus size={15} />
                    New list
                  </Button>
                </div>
                {!lists.length ? (
                  <p>No lists yet. Create your first one.</p>
                ) : (
                  <div className="list-buttons">
                    {lists.map((l) => (
                      <button
                        key={l.id}
                        className={selected === l.id ? "selected" : ""}
                        onClick={() => {
                          setSelected(l.id);
                          setQuery("");
                          setError("");
                        }}
                        aria-pressed={selected === l.id}
                      >
                        <BookOpen size={18} />
                        <span>
                          <strong>{l.name}</strong>
                          <small>
                            {l.wordCount} words · {l.activityCount} activities
                          </small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </aside>
              <section
                className="content-panel word-content"
                aria-label="Words in selected list"
              >
                {wordLoading ? (
                  <p role="status">Loading words…</p>
                ) : detail && detail.id === selected ? (
                  <>
                    <div className="section-heading">
                      <div>
                        <h2>{detail.name}</h2>
                        <p>
                          {detail.description ||
                            "A collection of phoneme words for your activities."}
                        </p>
                      </div>
                      <div className="form-actions">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label="Edit list details"
                          onClick={() =>
                            setListEditor(lists.find((l) => l.id === selected)!)
                          }
                        >
                          <Pencil size={15} />
                        </Button>
                        <DeleteDialog
                          label="this list"
                          description="This deletes the list and its words. Lists used by saved activities are protected."
                          onDelete={() => remove("/api/lists/" + selected)}
                        />
                      </div>
                    </div>
                    <div className="library-toolbar">
                      <Field id="word-filter" label="Find a word">
                        <input
                          id="word-filter"
                          className="text-input"
                          placeholder="Search English or phonemes…"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </Field>
                      <Button onClick={() => setWordEditor("new")}>
                        <Plus size={16} />
                        Add word
                      </Button>
                    </div>
                    {!shown.length ? (
                      <div className="empty-state">
                        <BookOpen size={28} />
                        <h3>
                          {detail.words.length
                            ? "No matching words"
                            : "Start with your first word"}
                        </h3>
                        <p>
                          {detail.words.length
                            ? "Try a different search."
                            : "Add an English word, its phonemes and an optional clue."}
                        </p>
                      </div>
                    ) : (
                      <div className="word-table-wrap">
                        <table className="word-table">
                          <caption className="sr-only">
                            Saved words in {detail.name}
                          </caption>
                          <thead>
                            <tr>
                              <th>English word</th>
                              <th>Phonemes</th>
                              <th>Word hint</th>
                              <th>
                                <span className="sr-only">Actions</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {shown.map((w) => (
                              <tr key={w.id}>
                                <td>
                                  <strong>{w.english}</strong>
                                </td>
                                <td>
                                  <span className="ipa">
                                    /{w.phonemes.join(" ")}/
                                  </span>
                                  <small>{w.phonemes.length} sounds</small>
                                </td>
                                <td>
                                  {w.hint || (
                                    <span className="muted">No hint</span>
                                  )}
                                </td>
                                <td>
                                  <div className="form-actions">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      aria-label={"Edit " + w.english}
                                      onClick={() => setWordEditor(w)}
                                    >
                                      <Pencil size={15} />
                                    </Button>
                                    <DeleteDialog
                                      label={w.english}
                                      description="This permanently removes the word. Words used by saved activities are protected."
                                      onDelete={() =>
                                        remove("/api/words/" + w.id)
                                      }
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="library-footer">
                      <span>{detail.words.length} saved words</span>
                      <Link className="text-link" href="/wordle">
                        Use words in an activity
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <BookOpen size={28} />
                    <h2>Create your first list</h2>
                    <p>
                      Your words will be saved here and available in both
                      builders.
                    </p>
                    <Button onClick={() => setListEditor("new")}>
                      New word list
                    </Button>
                  </div>
                )}
              </section>
            </div>
          </TabsContent>
          <TabsContent value="phonemes">
            <section className="content-panel">
              <div className="section-heading">
                <div>
                  <h2>Every sound has a place</h2>
                  <p>
                    These symbols and cues supply both activity keyboards and
                    hover hints.
                  </p>
                </div>
                <Button onClick={() => setPhonemeEditor("new")}>
                  <Plus size={16} />
                  Add phoneme
                </Button>
              </div>
              <div className="phoneme-catalog">
                {catalog.phonemes.map((p) => (
                  <article key={p.id} className="phoneme-card">
                    <span className="ipa">/{p.symbol}/</span>
                    <strong>
                      {p.label} (as in {p.example})
                    </strong>
                    <small>
                      {p.kind} · {p.usageCount} word positions
                    </small>
                    <div className="form-actions">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPhonemeEditor(p)}
                      >
                        Edit
                      </Button>
                      <DeleteDialog
                        label={"/" + p.symbol + "/"}
                        description="Phonemes referenced by saved words cannot be deleted."
                        onDelete={() => remove("/api/phonemes/" + p.id)}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </TabsContent>
        </Tabs>
      )}
      {listEditor && (
        <ListEditor
          item={listEditor === "new" ? null : listEditor}
          onClose={() => setListEditor(null)}
          onSaved={async (id) => {
            await refresh();
            setSelected(id);
            toast.success("Word list saved.");
          }}
        />
      )}
      {wordEditor && (
        <WordEditor
          item={wordEditor === "new" ? null : wordEditor}
          listId={selected}
          phonemes={catalog.phonemes}
          onClose={() => setWordEditor(null)}
          onSaved={async () => {
            await refresh();
            toast.success("Word saved.");
          }}
        />
      )}
      {phonemeEditor && (
        <PhonemeEditor
          item={phonemeEditor === "new" ? null : phonemeEditor}
          onClose={() => setPhonemeEditor(null)}
          onSaved={async () => {
            await refresh();
            toast.success("Phoneme saved.");
          }}
        />
      )}
    </Shell>
  );
}
