"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Upload, BookOpen, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Shell, HowItWorks } from "./shell";
import { usePreferences } from "./preferences";
import { Field } from "./forms";
export function AboutPage() {
  const { preferences, update } = usePreferences();
  const [localVideo, setLocalVideo] = useState("");
  const [urlDraft, setUrlDraft] = useState(preferences.videoUrl);
  const [videoError, setVideoError] = useState(false);
  useEffect(
    () => () => {
      if (localVideo) URL.revokeObjectURL(localVideo);
    },
    [localVideo],
  );
  const videoSource = localVideo || preferences.videoUrl;
  function setVideoUrl() {
    if (!urlDraft.trim()) {
      update({ videoUrl: "" });
      setVideoError(false);
      return;
    }
    try {
      const url = new URL(urlDraft);
      if (url.protocol !== "https:") throw new Error();
      update({ videoUrl: url.href });
      setVideoError(false);
      toast.success("Video link saved on this device.");
    } catch {
      toast.error("Enter a full HTTPS link to a playable MP4 or WebM video.");
    }
  }
  return (
    <Shell page="about">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE THINKING BEHIND THE SOUNDS</p>
          <h1>A little play, with a purpose.</h1>
          <p>
            A phoneme activity builder for teachers and speech pathology
            students.
          </p>
        </div>
        <HowItWorks />
      </div>
      <p className="about-intro">
        Phoneme Studio makes it easy to prepare sound-based classroom
        activities. Teachers choose the support their students need, preview the
        experience, then download one HTML file to use in a normal browser.
      </p>
      <div className="about-grid">
        <div className="settings-stack">
          <section className="content-panel">
            <div className="card-title">
              <span className="feature-icon">
                <BookOpen size={20} />
              </span>
              <h2>Assessment 2 · Saved classroom content</h2>
            </div>
            <p>
              This project extends the original npx create-next-app .
              application. Next.js route handlers validate requests and use
              Prisma to store words, phonemes and activity settings in SQLite.
              Teachers can create, edit, retrieve and delete their classroom
              content, then generate an HTML activity from a saved
              configuration.
            </p>
            <p>
              The supplied <strong>HCE Wordle Phoneme Corpus</strong> and Word
              Search examples provide starter content on first setup. After
              that, the word library is managed through the database. Wordle
              uses one saved target; Word Search uses a teacher-selected set of
              saved words.
            </p>
            <p>
              The corpus and example file are stored with the source code. Their
              phoneme boundaries are preserved; the source’s g and ɡ spellings
              are treated as the same sound. These activities support phoneme
              recognition and sound sequencing. Example spellings are cues for
              sounds; teachers can model pronunciations appropriate to their
              students’ accent and learning needs.
            </p>
            <div className="author-card">
              <span className="avatar">
                <UserRound size={20} />
              </span>
              <div>
                <strong>{preferences.name || "Your name"}</strong>
                <p>
                  {preferences.studentNumber
                    ? `Student number: ${preferences.studentNumber}`
                    : "Add your student number in Settings."}
                </p>
                <Link
                  className="text-link"
                  style={{ fontSize: 12 }}
                  href="/settings"
                >
                  Edit assessment details
                </Link>
              </div>
            </div>
          </section>
          <section className="content-panel">
            <h2>Two ways to practise</h2>
            <ul>
              <li>
                <strong>Wordle:</strong> choose phoneme symbols to build a two-
                to eight-sound guess. Colours, symbols and text show which
                sounds belong in the word. The completed word appears alongside
                its English equivalent.
              </li>
              <li>
                <strong>Word Search:</strong> find up to twelve saved phoneme
                sequences in a generated grid. Drag along a word, select its
                endpoints, or use arrow keys and Enter. Show answers provides a
                practice guide.
              </li>
              <li>
                <strong>Difficulty:</strong> Wordle offers 8, 6 or 4 guesses.
                Word Search suggests 7 × 7, 10 × 10 or 12 × 12 grids, supports
                custom rows and columns, and adds directions at higher levels.
              </li>
            </ul>
          </section>
        </div>
        <section className="content-panel">
          <div className="card-title">
            <span className="feature-icon">
              <Video size={20} />
            </span>
            <h2>Your video walkthrough</h2>
          </div>
          <p>
            Add your recorded demonstration and verbal design justification
            here. The guide below covers what to show and explain.
          </p>
          {videoSource ? (
            <>
              <video
                key={videoSource}
                className="walkthrough-video"
                controls
                preload="metadata"
                src={videoSource}
                onError={() => setVideoError(true)}
                aria-label="Website demonstration and design justification"
              >
                Your browser does not support this video.
              </video>
              {videoError && (
                <p className="error-text">
                  This video could not be loaded. Use a direct MP4 or WebM link,
                  or select a file below.
                </p>
              )}
            </>
          ) : (
            <div className="video-placeholder">
              <Video size={32} />
              <strong>A place for your walkthrough</strong>
              <p>
                Record a short demonstration, then choose your video to preview
                it here.
              </p>
            </div>
          )}
          <div style={{ marginTop: 17, marginBottom: 18 }}>
            <label className="file-label">
              <Upload size={15} />
              Choose a video
              <input
                className="sr-only"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("video/")) {
                    toast.error("Please choose a video file.");
                    return;
                  }
                  setLocalVideo(URL.createObjectURL(file));
                  setVideoError(false);
                }}
              />
            </label>
            <p className="field-help" style={{ marginTop: 8 }}>
              Local files are previewed on this page only and are not uploaded.
              A saved video link stays on this browser.
            </p>
          </div>
          <Field id="video-url" label="Or use a direct video link">
            <input
              id="video-url"
              className="text-input"
              type="url"
              maxLength={500}
              placeholder="https://example.com/walkthrough.mp4"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onBlur={setVideoUrl}
              onKeyDown={(e) => {
                if (e.key === "Enter") setVideoUrl();
              }}
            />
          </Field>
          <details className="recording-script" open>
            <summary>Assessment 2 walkthrough guide</summary>
            <p>
              <strong>1. Introduce yourself.</strong> Show your student ID in
              the first 30 seconds. Keep your face visible and narrate
              throughout. Introduce the two classroom activities and explain
              that this assessment adds a backend and database.
            </p>
            <p>
              <strong>2. Manage content.</strong> Open Word library, create a
              list, add a word using separate phoneme tokens, save it, reopen it
              and edit its hint. Explain that multi-character sounds such as
              /tʃ/ occupy one ordered database position. Show validation by
              entering an unknown symbol. Add that symbol through the phoneme
              library if needed.
            </p>
            <p>
              <strong>3. Save and generate.</strong> Use your new list in
              Wordle, save the configuration and reload the page. Generate and
              play the HTML file. Repeat with Word Search using several saved
              words. Open Saved activities and demonstrate editing and deleting
              a configuration, then delete a word that is no longer in use.
            </p>
            <p>
              <strong>4. Explain the backend.</strong> Show the Prisma schema
              and one route handler. Words belong to lists; ordered WordSound
              records reference phonemes. Activities reference a list, a
              difficulty and either one target or ordered search words. Server
              validation and database foreign keys protect those relationships.
            </p>
            <p>
              <strong>5. Demonstrate Docker and health.</strong> Run docker
              compose up --build. Show the container running and the /health
              request returning 200 OK. Save content, restart the container and
              show that it remains in the named database volume.
            </p>
            <p>
              <strong>6. Discuss the design.</strong> The original responsive
              interface and offline game runtime are retained. Draft previews
              use content retrieved from the backend; downloads read saved
              settings and current words on the server. SQLite keeps setup small
              for a single teacher workspace. Authentication, multiple-user
              permissions and larger deployments can be added later.
            </p>
          </details>
        </section>
      </div>
    </Shell>
  );
}
