"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Download,
  SlidersHorizontal,
  Eye,
  Monitor,
  Smartphone,
  RotateCcw,
  Save,
  Shuffle,
  FolderOpen,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Shell } from "./shell";
import { Field, Toggle, ErrorNotice } from "./forms";
import { usePreferences } from "./preferences";
import {
  DEFAULTS,
  phonemeLabel,
  type ActivityConfig,
  type ActivityType,
  type ActivityContent,
  type Catalog,
  type WordListSummary,
  type WordListDetail,
  type SavedActivity,
  type Difficulty,
} from "@/lib/studio/data";
import { generateHtml } from "@/lib/studio/export";
import { api, send } from "@/lib/client/api";
import { downloadSavedActivity } from "@/lib/client/download";

function LivePreview({
  config,
  content,
}: {
  config: ActivityConfig;
  content: ActivityContent | null;
}) {
  const [size, setSize] = useState("desktop"),
    [restart, setRestart] = useState(0);
  const preview = useMemo(() => {
    if (!content)
      return { html: "", error: "Choose a saved list and words to begin." };
    try {
      return { html: generateHtml(config, content), error: "" };
    } catch (e) {
      return { html: "", error: (e as Error).message };
    }
  }, [config, content]);
  return (
    <section className="preview-panel" aria-label="Live student preview">
      <div className="preview-toolbar">
        <div className="preview-title">
          <Eye size={16} />
          Student preview<span className="tag">Interactive</span>
        </div>
        <div className="preview-actions">
          {[
            { name: "desktop", label: "Desktop preview", icon: Monitor },
            { name: "mobile", label: "Phone preview", icon: Smartphone },
          ].map((v) => (
            <button
              key={v.name}
              className="icon-button"
              aria-label={v.label}
              aria-pressed={size === v.name}
              onClick={() => setSize(v.name)}
            >
              <v.icon size={16} />
            </button>
          ))}
          <button
            className="icon-button"
            aria-label="Restart preview"
            onClick={() => setRestart((v) => v + 1)}
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
      <div className={"preview-stage " + size}>
        {preview.html ? (
          <iframe
            key={restart}
            srcDoc={preview.html}
            title={"Playable phoneme " + config.type + " preview"}
            sandbox="allow-scripts"
            style={{
              minHeight:
                config.type === "wordle"
                  ? content!.level.attempts * 53 + 550
                  : 830,
            }}
          />
        ) : (
          <div className="empty-state">
            <Eye size={26} />
            <h2>Ready for your content</h2>
            <p>{preview.error}</p>
          </div>
        )}
      </div>
      <div className="preview-caption">
        Preview your changes here. Downloading saves the activity first and
        generates it from the database.
      </div>
    </section>
  );
}
function selection(list: WordListDetail, type: ActivityType) {
  return {
    listId: list.id,
    wordId:
      type === "wordle"
        ? (list.words.find(
            (w) => w.phonemes.length >= 2 && w.phonemes.length <= 8,
          )?.id ?? "")
        : "",
    wordIds:
      type === "word-search" ? list.words.slice(0, 5).map((w) => w.id) : [],
  };
}
export function BuilderPage({ type }: { type: ActivityType }) {
  const { preferences } = usePreferences();
  const [config, setConfig] = useState<ActivityConfig>(() => ({
    ...DEFAULTS[type],
    theme: preferences.theme,
  }));
  const [catalog, setCatalog] = useState<Catalog | null>(null),
    [lists, setLists] = useState<WordListSummary[]>([]);
  const [list, setList] = useState<WordListDetail | null>(null),
    [activityId, setActivityId] = useState("");
  const [lastSaved, setLastSaved] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false),
    [error, setError] = useState(""),
    [wordQuery, setWordQuery] = useState("");
  const requestNumber = useRef(0);
  const appearance = useRef(preferences.theme);
  useEffect(() => {
    appearance.current = preferences.theme;
  }, [preferences.theme]);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [nextCatalog, nextLists] = await Promise.all([
          api<Catalog>("/api/catalog"),
          api<WordListSummary[]>("/api/lists"),
        ]);
        const id = new URLSearchParams(window.location.search).get("activity");
        const saved = id
          ? await api<SavedActivity>("/api/activities/" + id)
          : null;
        if (saved && saved.config.type !== type)
          throw new Error("Open this saved activity in its matching builder.");
        const chosen =
          saved?.config.listId ??
          (type === "word-search"
            ? nextLists.find((l) => l.wordCount > 0 && l.wordCount <= 12)?.id
            : undefined) ??
          nextLists[0]?.id;
        const detail = chosen
          ? await api<WordListDetail>("/api/lists/" + chosen)
          : null;
        if (!active) return;
        setCatalog(nextCatalog);
        setLists(nextLists);
        setList(detail);
        const draft = saved?.config ?? {
          ...DEFAULTS[type],
          theme: appearance.current,
          ...(detail ? selection(detail, type) : {}),
        };
        setConfig(draft);
        setActivityId(saved?.id ?? "");
        setLastSaved(saved ? JSON.stringify(draft) : "");
        setError("");
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
    // Appearance changes don't reload or discard a draft. Output theme is saved independently.
  }, [type]);
  function change(value: Partial<ActivityConfig>) {
    setConfig((c) => ({ ...c, ...value }));
    setError("");
  }
  async function chooseList(id: string) {
    const request = ++requestNumber.current;
    setListLoading(true);
    setList(null);
    change({ listId: id, wordId: "", wordIds: [] });
    try {
      const detail = await api<WordListDetail>("/api/lists/" + id);
      if (request !== requestNumber.current) return;
      setList(detail);
      change(selection(detail, type));
    } catch (e) {
      if (request === requestNumber.current) setError((e as Error).message);
    } finally {
      if (request === requestNumber.current) setListLoading(false);
    }
  }
  const level = catalog?.difficulties.find((l) => l.id === config.difficulty);
  const content = useMemo(
    () =>
      catalog && list && level
        ? { words: list.words, phonemes: catalog.phonemes, level }
        : null,
    [catalog, list, level],
  );
  const dirty = JSON.stringify(config) !== lastSaved;
  const target = list?.words.find((w) => w.id === config.wordId);
  const eligible =
    list?.words.filter(
      (w) =>
        type === "word-search" ||
        (w.phonemes.length >= 2 && w.phonemes.length <= 8),
    ) ?? [];
  const ready = Boolean(
    config.title.trim() &&
      list &&
      !listLoading &&
      (type === "wordle" ? target : config.wordIds.length),
  );
  async function save(asNew = false): Promise<SavedActivity> {
    const existing = activityId && !asNew;
    const result = await api<SavedActivity>(
      "/api/activities" + (existing ? "/" + activityId : ""),
      send(existing ? "PUT" : "POST", config),
    );
    setActivityId(result.id);
    setConfig(result.config);
    setLastSaved(JSON.stringify(result.config));
    window.history.replaceState(
      null,
      "",
      window.location.pathname + "?activity=" + result.id,
    );
    return result;
  }
  async function act(download = false, asNew = false) {
    setBusy(true);
    setError("");
    try {
      const saved = await save(asNew);
      if (download) await downloadSavedActivity(saved.id, saved.config.title);
      toast.success(download ? "Saved and downloaded." : "Activity saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const name = type === "wordle" ? "Wordle" : "Word Search";
  return (
    <Shell page={type}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <ChevronRight size={13} />
        <span>{name} builder</span>
      </nav>
      <div className="page-heading builder-heading">
        <div>
          <p className="eyebrow">YOUR SOUNDS. READY FOR CLASS.</p>
          <h1>Create a phoneme {name}</h1>
          <p>Choose saved content, try the activity, and take it to class.</p>
        </div>
        <Button
          className="primary-button"
          disabled={!ready || busy || loading}
          onClick={() => void act(true)}
        >
          <Download size={16} />
          {busy ? "Working…" : "Save & generate HTML"}
        </Button>
      </div>
      <ErrorNotice message={error} />
      {loading ? (
        <div className="content-panel" role="status">
          Loading your saved content…
        </div>
      ) : !catalog ? (
        <div className="empty-state">
          <p>The content library could not be loaded.</p>
          <Button onClick={() => window.location.reload()}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="save-toolbar">
            <div className="save-status">
              <span className={"status-label " + (dirty ? "unsaved" : "saved")}>
                {activityId
                  ? dirty
                    ? "Unsaved changes"
                    : "Saved activity"
                  : "New activity"}
              </span>
              <span>Your settings and word choices are stored together.</span>
            </div>
            <div className="form-actions">
              <Button variant="outline" asChild>
                <Link href="/activities">
                  <FolderOpen size={16} />
                  Saved activities
                </Link>
              </Button>
              {activityId && (
                <Button
                  variant="outline"
                  disabled={!ready || busy}
                  onClick={() => void act(false, true)}
                >
                  <Plus size={15} />
                  Save as new
                </Button>
              )}
              <Button disabled={!ready || busy} onClick={() => void act()}>
                <Save size={16} />
                Save activity
              </Button>
            </div>
          </div>
          <div className="builder-layout">
            <section
              className="config-panel"
              aria-label="Activity configuration"
            >
              <div className="panel-heading">
                <SlidersHorizontal size={16} />
                Activity settings
              </div>
              <div className="config-body">
                <div className="form-section">
                  <p className="section-title">1 · The basics</p>
                  <Field id="activity-title" label="Activity title">
                    <input
                      id="activity-title"
                      className="text-input"
                      maxLength={70}
                      value={config.title}
                      onChange={(e) => change({ title: e.target.value })}
                    />
                  </Field>
                  <Field id="instructions" label="Student instructions">
                    <textarea
                      id="instructions"
                      className="text-input"
                      maxLength={500}
                      rows={3}
                      value={config.instructions}
                      onChange={(e) => change({ instructions: e.target.value })}
                    />
                  </Field>
                  <Field id="difficulty" label="Difficulty">
                    <Select
                      value={config.difficulty}
                      onValueChange={(value) => {
                        const l = catalog.difficulties.find(
                          (l) => l.id === value,
                        )!;
                        change({
                          difficulty: value as Difficulty,
                          ...(type === "word-search"
                            ? { rows: l.size, cols: l.size }
                            : {}),
                        });
                      }}
                    >
                      <SelectTrigger id="difficulty" className="select-control">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.difficulties.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.label} ·{" "}
                            {type === "wordle"
                              ? l.attempts + " guesses"
                              : l.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {type === "word-search" && (
                    <div className="grid-dimensions">
                      {(["rows", "cols"] as const).map((key) => (
                        <Field
                          key={key}
                          id={"grid-" + key}
                          label={key === "rows" ? "Rows" : "Columns"}
                        >
                          <input
                            id={"grid-" + key}
                            className="text-input"
                            type="number"
                            min={6}
                            max={16}
                            value={config[key]}
                            onChange={(e) =>
                              change({ [key]: Number(e.target.value) })
                            }
                          />
                        </Field>
                      ))}
                    </div>
                  )}
                  <Field id="output-theme" label="Activity theme">
                    <Select
                      value={config.theme}
                      onValueChange={(value) =>
                        change({ theme: value as "light" | "dark" })
                      }
                    >
                      <SelectTrigger
                        id="output-theme"
                        className="select-control"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="form-section">
                  <p className="section-title">2 · Saved words & support</p>
                  <Field id="word-list" label="Word list">
                    <Select
                      value={config.listId}
                      onValueChange={(id) => void chooseList(id)}
                      disabled={listLoading}
                    >
                      <SelectTrigger id="word-list" className="select-control">
                        <SelectValue placeholder="Choose a word list" />
                      </SelectTrigger>
                      <SelectContent>
                        {lists.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name} · {l.wordCount}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Link className="text-link manage-link" href="/library">
                    Add or edit words in the library
                  </Link>
                  {listLoading ? (
                    <p role="status">Loading words…</p>
                  ) : !eligible.length ? (
                    <p className="field-help">
                      This list has no suitable words. Add a word in the library
                      {type === "wordle" ? " with 2–8 phonemes" : ""}.
                    </p>
                  ) : type === "wordle" ? (
                    <>
                      <Field id="focus-word" label="Focus word">
                        <Select
                          value={config.wordId}
                          onValueChange={(wordId) => change({ wordId })}
                        >
                          <SelectTrigger
                            id="focus-word"
                            className="select-control"
                          >
                            <SelectValue placeholder="Choose a word" />
                          </SelectTrigger>
                          <SelectContent>
                            {eligible.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.english} · /{w.phonemes.join("")}/
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      {target && (
                        <div className="target-word">
                          <div>
                            <div className="ipa">
                              /
                              {target.phonemes.map((sound, i) => (
                                <Tooltip key={i}>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0}>{sound}</span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {phonemeLabel(sound, catalog.phonemes)}
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                              /
                            </div>
                            <small>
                              {target.english.toUpperCase()} ·{" "}
                              {target.phonemes.length} phonemes
                            </small>
                            {target.hint && (
                              <p className="field-help">Hint: {target.hint}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <Field
                        id="choose-words"
                        label={
                          "Words to find · " + config.wordIds.length + "/12"
                        }
                      >
                        <input
                          id="choose-words"
                          className="text-input"
                          placeholder="Filter words…"
                          value={wordQuery}
                          onChange={(e) => setWordQuery(e.target.value)}
                        />
                      </Field>
                      <div
                        className="word-picker"
                        role="group"
                        aria-label="Words to include"
                      >
                        {eligible
                          .filter((w) =>
                            w.english
                              .toLowerCase()
                              .includes(wordQuery.toLowerCase()),
                          )
                          .map((w) => (
                            <label key={w.id} className="word-choice">
                              <input
                                type="checkbox"
                                checked={config.wordIds.includes(w.id)}
                                disabled={
                                  !config.wordIds.includes(w.id) &&
                                  config.wordIds.length >= 12
                                }
                                onChange={(e) =>
                                  change({
                                    wordIds: e.target.checked
                                      ? [...config.wordIds, w.id]
                                      : config.wordIds.filter(
                                          (id) => id !== w.id,
                                        ),
                                  })
                                }
                              />
                              <span>
                                <strong>{w.english}</strong>
                                <span className="ipa">
                                  /{w.phonemes.join(" ")}/
                                </span>
                              </span>
                            </label>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() =>
                          change({ seed: (config.seed + 1) % 2147483647 })
                        }
                      >
                        <Shuffle size={14} />
                        New arrangement
                      </Button>
                    </>
                  )}
                  <Toggle
                    id="phoneme-hints"
                    label="Phoneme & word hints"
                    help="Sound examples and saved word clues."
                    checked={config.hints}
                    onChange={(hints) => change({ hints })}
                  />
                  <Toggle
                    id="english-labels"
                    label={
                      type === "wordle"
                        ? "Keyboard letter labels"
                        : "English word labels"
                    }
                    help="Familiar letter cues alongside phonemes."
                    checked={config.labels}
                    onChange={(labels) => change({ labels })}
                  />
                </div>
                <div className="download-zone">
                  <Button
                    className="primary-button"
                    disabled={!ready || busy}
                    onClick={() => void act(true)}
                  >
                    <Download size={16} />
                    Save & generate HTML
                  </Button>
                  <p>One file, generated from your saved activity.</p>
                </div>
              </div>
            </section>
            <LivePreview config={config} content={content} />
          </div>
        </>
      )}
    </Shell>
  );
}
