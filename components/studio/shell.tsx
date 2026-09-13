"use client";
import Link from "next/link";
import {
  AudioLines,
  Home,
  Info,
  Menu,
  Settings,
  Grid3X3,
  PanelsTopLeft,
  Monitor,
  Download,
  SlidersHorizontal,
  BookOpen,
  FolderOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePreferences } from "./preferences";
import type { Page } from "@/lib/studio/data";
const links = [
  { href: "/", label: "Home", page: "home", icon: Home },
  { href: "/wordle", label: "Wordle", page: "wordle", icon: PanelsTopLeft },
  {
    href: "/word-search",
    label: "Word Search",
    page: "word-search",
    icon: Grid3X3,
  },
  { href: "/library", label: "Word library", page: "library", icon: BookOpen },
  {
    href: "/activities",
    label: "Saved activities",
    page: "activities",
    icon: FolderOpen,
  },
  { href: "/about", label: "About", page: "about", icon: Info },
  { href: "/settings", label: "Settings", page: "settings", icon: Settings },
];
export function Shell({
  page,
  children,
}: {
  page: Page;
  children: React.ReactNode;
}) {
  const { preferences } = usePreferences();
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Phoneme Studio home">
          <span className="brand-mark">
            <AudioLines size={25} />
          </span>
          <span>
            phoneme studio<small>EVERY SOUND COUNTS</small>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          {links.slice(0, 5).map((l) => (
            <Link
              key={l.page}
              href={l.href}
              aria-current={page === l.page ? "page" : undefined}
              className={page === l.page ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header-end">
          <span className="assessment-chip">Assessment 2</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="icon-button" aria-label="Open navigation menu">
                <Menu size={19} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[190px]">
              {links.map((l) => (
                <DropdownMenuItem key={l.page} asChild>
                  <Link href={l.href}>
                    <l.icon size={16} />
                    {l.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="main" id="main">
        {children}
      </main>
      <footer className="footer">
        <div>
          <strong>Phoneme Activity Builder</strong>
          <span> · Assessment 2</span>
          <br />
          <span>
            {preferences.name || "Your name"} ·{" "}
            {preferences.studentNumber || "Student number not set"}
          </span>
        </div>
        <div className="footer-right">
          <span>Made for learning, one sound at a time.</span>
          <Link href="/about">About</Link>
          <Link href="/settings">Settings</Link>
        </div>
      </footer>
    </>
  );
}
export function HowItWorks() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="help-button">
          <Info size={16} />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog-body">
        <DialogHeader>
          <DialogTitle>Create a classroom activity</DialogTitle>
          <DialogDescription>
            From a few choices to a ready-to-play HTML file.
          </DialogDescription>
        </DialogHeader>
        {[
          {
            title: "Choose and configure",
            text: "Create a word list in the library, then open Wordle or Word Search. Add a title and instructions, then choose a difficulty and the amount of phoneme support.",
            icon: SlidersHorizontal,
          },
          {
            title: "Try the student experience",
            text: "Play directly in the live preview. In Wordle, build a guess using the phoneme keyboard. In Word Search, drag along a word or select its first and last tiles.",
            icon: Monitor,
          },
          {
            title: "Generate and take it to class",
            text: "Save your activity, then select Save & generate HTML. The backend reads the saved settings and words. Open the downloaded .html file in a normal web browser. It includes the complete game and works offline.",
            icon: Download,
          },
        ].map((s, i) => (
          <div className="guide-step" key={s.title}>
            <span className="step-number">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
        <p className="field-help">
          One tile represents one phoneme. For example, /θ/ is the TH sound in
          “thin”; /ŋ/ is the NG sound in “ring”. Model sounds aloud with your
          students.
        </p>
      </DialogContent>
    </Dialog>
  );
}
