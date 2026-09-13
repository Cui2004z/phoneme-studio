"use client";
import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

export function Field({
  id,
  label,
  children,
  help,
}: {
  id: string;
  label: string;
  children: ReactNode;
  help?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {help && (
        <p className="field-help" id={id + "-help"}>
          {help}
        </p>
      )}
    </div>
  );
}
export function Toggle({
  id,
  label,
  help,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="toggle-row">
      <div>
        <label htmlFor={id}>{label}</label>
        <p id={id + "-help"}>{help}</p>
      </div>
      <Switch
        id={id}
        className="studio-switch"
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={id + "-help"}
      />
    </div>
  );
}
export function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error-notice">
      {message}
    </div>
  ) : null;
}
export function DeleteDialog({
  label,
  description,
  onDelete,
}: {
  label: string;
  description: string;
  onDelete: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!busy) {
          setOpen(v);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label={"Delete " + label}>
          <Trash2 size={15} />
          <span className="sr-only">Delete</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-body">
        <DialogHeader>
          <DialogTitle>Delete {label}?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ErrorNotice message={error} />
        <div className="form-actions">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await onDelete();
                setOpen(false);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
