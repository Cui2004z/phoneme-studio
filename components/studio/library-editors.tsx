"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, ErrorNotice } from "./forms";
import { api, send } from "@/lib/client/api";
import type {
  WordListSummary,
  StoredWord,
  StoredPhoneme,
} from "@/lib/studio/data";

function Frame({
  title,
  description,
  busy,
  error,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  description: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="dialog-body">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <ErrorNotice message={error} />
          {children}
          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ListEditor({
  item,
  onClose,
  onSaved,
}: {
  item: WordListSummary | null;
  onClose: () => void;
  onSaved: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(item?.name ?? ""),
    [description, setDescription] = useState(item?.description ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Frame
      title={item ? "Edit word list" : "New word list"}
      description="Keep related words together for your classroom activities."
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const saved = await api<WordListSummary>(
            "/api/lists" + (item ? "/" + item.id : ""),
            send(item ? "PUT" : "POST", { name, description }),
          );
          await onSaved(saved.id);
          onClose();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field id="list-name" label="List name">
        <input
          autoFocus
          id="list-name"
          className="text-input"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="For example, TH sounds"
        />
      </Field>
      <Field id="list-description" label="Description (optional)">
        <textarea
          id="list-description"
          className="text-input"
          rows={3}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
    </Frame>
  );
}
export function WordEditor({
  item,
  listId,
  phonemes,
  onClose,
  onSaved,
}: {
  item: StoredWord | null;
  listId: string;
  phonemes: StoredPhoneme[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [english, setEnglish] = useState(item?.english ?? ""),
    [tokens, setTokens] = useState(item?.phonemes.join(" ") ?? ""),
    [hint, setHint] = useState(item?.hint ?? "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Frame
      title={item ? "Edit word" : "Add a word"}
      description="Separate phonemes with spaces. A sound such as tʃ or æɪ stays together."
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api(
            item ? "/api/words/" + item.id : "/api/lists/" + listId + "/words",
            send(item ? "PUT" : "POST", {
              english,
              phonemes: tokens.trim().split(/\s+/).filter(Boolean),
              hint,
            }),
          );
          await onSaved();
          onClose();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field id="word-english" label="English word">
        <input
          autoFocus
          id="word-english"
          className="text-input"
          required
          maxLength={80}
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          placeholder="thin"
        />
      </Field>
      <Field
        id="word-phonemes"
        label="Phonemes"
        help="Use 1–12 sounds. Wordle targets use 2–8 sounds. Click symbols below or type them with spaces."
      >
        <input
          id="word-phonemes"
          className="text-input phoneme-input"
          required
          maxLength={120}
          value={tokens}
          onChange={(e) => setTokens(e.target.value)}
          placeholder="θ ɪ n"
          aria-describedby="word-phonemes-help"
        />
      </Field>
      <details className="phoneme-entry" open>
        <summary>Phoneme keyboard</summary>
        <div className="entry-keyboard">
          {phonemes.map((p) => (
            <button
              type="button"
              key={p.id}
              title={
                "/" + p.symbol + "/ · " + p.label + " (as in " + p.example + ")"
              }
              onClick={() =>
                setTokens((t) => (t.trim() ? t.trim() + " " : "") + p.symbol)
              }
            >
              <span>{p.symbol}</span>
              <small>{p.label}</small>
            </button>
          ))}
        </div>
      </details>
      <Field
        id="word-hint"
        label="Word hint (optional)"
        help="Shown in activities when hints are enabled."
      >
        <textarea
          id="word-hint"
          className="text-input"
          rows={2}
          maxLength={300}
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          placeholder="A short clue to help students."
        />
      </Field>
    </Frame>
  );
}
export function PhonemeEditor({
  item,
  onClose,
  onSaved,
}: {
  item: StoredPhoneme | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [symbol, setSymbol] = useState(item?.symbol ?? ""),
    [label, setLabel] = useState(item?.label ?? ""),
    [example, setExample] = useState(item?.example ?? ""),
    [kind, setKind] = useState(item?.kind ?? "consonant");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Frame
      title={item ? "Edit phoneme" : "Add a phoneme"}
      description="Define the symbol and the familiar spelling cue used in activity hints."
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await api(
            "/api/phonemes" + (item ? "/" + item.id : ""),
            send(item ? "PUT" : "POST", { symbol, label, example, kind }),
          );
          await onSaved();
          onClose();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field
        id="phoneme-symbol"
        label="Phoneme symbol"
        help="One sound, without surrounding slashes or spaces."
      >
        <input
          autoFocus
          id="phoneme-symbol"
          className="text-input phoneme-input"
          required
          maxLength={8}
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="θ"
        />
      </Field>
      <Field id="phoneme-label" label="Letter cue">
        <input
          id="phoneme-label"
          className="text-input"
          required
          maxLength={20}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="TH"
        />
      </Field>
      <Field id="phoneme-example" label="Example word">
        <input
          id="phoneme-example"
          className="text-input"
          required
          maxLength={80}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="thin"
        />
      </Field>
      <Field id="phoneme-kind" label="Sound group">
        <Select
          value={kind}
          onValueChange={(v) => setKind(v as "consonant" | "vowel")}
        >
          <SelectTrigger id="phoneme-kind" className="select-control">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consonant">Consonant</SelectItem>
            <SelectItem value="vowel">Vowel</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </Frame>
  );
}
