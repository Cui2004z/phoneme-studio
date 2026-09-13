"use client";
import Link from "next/link";
import {
  ArrowRight,
  PanelsTopLeft,
  Grid3X3,
  Laptop,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Shell, HowItWorks } from "./shell";
export function HomePage() {
  return (
    <Shell page="home">
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR CLASSROOM. YOUR WAY.</p>
          <h1>What will you create today?</h1>
          <p>
            Bring sounds to life with a little play. Build a phoneme activity
            for your students.
          </p>
        </div>
        <HowItWorks />
      </div>
      <div className="collection-links">
        <Link href="/library">
          <strong>Word library</strong>
          <span>Create and edit words, phonemes and hints.</span>
          <ArrowRight size={18} />
        </Link>
        <Link href="/activities">
          <strong>Saved activities</strong>
          <span>Reopen a configuration and download it again.</span>
          <ArrowRight size={18} />
        </Link>
      </div>
      <div className="home-cards">
        <article className="activity-card">
          <div className="card-art" aria-hidden="true">
            <span className="art-label">ONE WORD. A FEW GOOD GUESSES.</span>
            <div className="demo-wordle">
              {["s", "l", "ɪ", "p", "t", "ɹ", "æɪ", "n"].map((s, i) => (
                <span
                  key={i}
                  className={
                    i === 1 || i >= 4 ? "good" : i === 2 ? "close" : ""
                  }
                >
                  {s}
                </span>
              ))}
            </div>
            <span className="sound-note">
              <b>/θ/</b> TH as in thin
            </span>
          </div>
          <div className="card-body">
            <div className="card-title">
              <span className="feature-icon">
                <PanelsTopLeft size={21} />
              </span>
              <h2>Phoneme Wordle</h2>
            </div>
            <p>
              A familiar guessing game with a sound-first twist. Help students
              recognise phonemes and build a word, one tile at a time.
            </p>
            <div className="tag-row">
              <span className="tag">Choose a saved word</span>
              <span className="tag">Colour & symbol feedback</span>
              <span className="tag">3 difficulty levels</span>
            </div>
            <Button className="primary-button" asChild>
              <Link href="/wordle">
                Create a Wordle
                <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
        </article>
        <article className="activity-card">
          <div className="card-art search-art" aria-hidden="true">
            <span className="art-label">A LITTLE SEARCH. LOTS OF SOUNDS.</span>
            <div className="demo-search">
              {[
                "θ",
                "p",
                "æ",
                "t",
                "k",
                "tʃ",
                "ɪ",
                "n",
                "b",
                "ʉː",
                "ɹ",
                "ŋ",
                "t",
                "h",
                "ʃ",
                "m",
                "s",
                "ɐ",
                "ɪ",
                "p",
              ].map((s, i) => (
                <span key={i} className={[5, 6, 7].includes(i) ? "found" : ""}>
                  {s}
                </span>
              ))}
            </div>
            <span className="sound-note">
              <b>/tʃɪn/</b> found it!
            </span>
          </div>
          <div className="card-body">
            <div className="card-title">
              <span className="feature-icon green">
                <Grid3X3 size={21} />
              </span>
              <h2>Phoneme Word Search</h2>
            </div>
            <p>
              Turn phoneme recognition into a sound-finding adventure. Students
              explore a grid and uncover words from their teacher’s saved lists.
            </p>
            <div className="tag-row">
              <span className="tag">Your saved word lists</span>
              <span className="tag">Adjustable grid</span>
              <span className="tag">Drag, click or keyboard</span>
            </div>
            <Button className="primary-button green-button" asChild>
              <Link href="/word-search">
                Create a Word Search
                <ArrowRight size={17} />
              </Link>
            </Button>
          </div>
        </article>
      </div>
      <div className="workflow" aria-label="Activity creation steps">
        {[
          {
            title: "Make it yours",
            text: "Choose a saved word list and the support students need.",
          },
          {
            title: "Give it a go",
            text: "Try the activity in a live student preview.",
          },
          {
            title: "Download. Open. Play.",
            text: "Save your settings, then download a complete HTML file.",
          },
        ].map((s, i) => (
          <div className="workflow-item" key={s.title}>
            <span className="step-number">{i + 1}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="home-note">
        <span>
          <Heart size={15} />
          Thoughtfully built for speech pathology learning.
        </span>
        <span>
          <Laptop size={15} />
          Downloaded activities work offline. No student accounts needed.
        </span>
      </div>
    </Shell>
  );
}
