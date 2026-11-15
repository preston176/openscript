"use client";

import { Check, Download, Film, Lock, Pause, Play, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import s from "./demo-reel.module.css";

// Screen Studio style product demo, ported from Offsite's DemoReel: the editor UI is scripted
// like a screen recording, with a moving cursor and a camera that zooms into the action.
// Everything is HTML. Labels match the real transcript panel in apps/web.
const W = 1200;
const H = 740;
const PX_PER_S = 68;

type Kind = "word" | "filler" | "retake";
type Word = { id: string; text: string; dur: number; kind: Kind };

const RAW: [string, number, Kind?][] = [
  ["Hey,", 0.4], ["um,", 0.6, "filler"], ["welcome", 0.4], ["back", 0.3], ["to", 0.15], ["the", 0.15], ["show.", 0.5],
  ["Today", 0.4], ["we're,", 0.3], ["uh,", 0.7, "filler"], ["talking", 0.4], ["about", 0.3], ["how", 0.2], ["to", 0.15],
  ["edit", 0.3], ["video,", 0.5], ["you", 0.3, "filler"], ["know,", 0.4, "filler"], ["without", 0.4], ["a", 0.1], ["timeline.", 0.7],
  ["Wait,", 0.5, "retake"], ["let", 0.2, "retake"], ["me", 0.15, "retake"], ["start", 0.3, "retake"], ["that", 0.2, "retake"], ["again.", 0.6, "retake"],
  ["Editing", 0.5], ["video", 0.4], ["should", 0.3], ["feel", 0.3], ["as", 0.15], ["easy", 0.35], ["as", 0.15], ["editing", 0.4], ["a", 0.1], ["document.", 0.8],
];
const WORDS: Word[] = RAW.map(([text, dur, kind = "word"], i) => ({ id: `w${i}`, text, dur, kind }));
const FILLERS = WORDS.filter((w) => w.kind === "filler").map((w) => w.id);
const RETAKE = WORDS.filter((w) => w.kind === "retake").map((w) => w.id);
// "you know" is one filler phrase, as in apps/web/src/transcript-editor/filler-words.ts.
const FILLER_COUNT = 3;

const fmt = (sec: number) => `0:${sec.toFixed(1).padStart(4, "0")}`;
// Real progress ramps up, cruises, then settles: ease the demo the same way.
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

type Status = { kind: "idle" } | { kind: "transcribing"; p: number } | { kind: "ready" };

class Stop extends Error {}

export function DemoReel() {
  const root = useRef<HTMLElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  const [width, setWidth] = useState(W);
  const [cam, setCam] = useState({ x: W / 2, y: H / 2, z: 1 });
  const [cursor, setCursor] = useState({ x: 900, y: 600 });
  const [pressed, setPressed] = useState(false);
  const [ripple, setRipple] = useState(0);

  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [selected, setSelected] = useState<string[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [exportP, setExportP] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // The loop reads these between frames, so they live in refs as well as state.
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  const onscreenRef = useRef(false);

  useEffect(() => {
    const el = viewport.current!;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      playingRef.current = false;
      setPlaying(false);
    }
    const io = new IntersectionObserver(([e]) => (onscreenRef.current = e.isIntersecting), { threshold: 0.25 });
    io.observe(root.current!);
    let alive = true;

    // Time only advances while the reel is playing, on screen, and the tab is visible.
    async function sleep(ms: number) {
      let left = ms;
      while (left > 0) {
        if (!alive) throw new Stop();
        const step = Math.min(50, left);
        await new Promise((r) => setTimeout(r, step));
        if (playingRef.current && onscreenRef.current && !document.hidden) left -= step;
      }
    }

    function at(name: string) {
      const el = scene.current?.querySelector<HTMLElement>(`[data-demo="${name}"]`);
      if (!el || !scene.current) return { x: W / 2, y: H / 2 };
      const sr = scene.current.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // Undo the current fit and camera zoom to get scene coordinates.
      const k = sr.width / W;
      return { x: (r.left + r.width / 2 - sr.left) / k, y: (r.top + r.height / 2 - sr.top) / k };
    }

    async function move(name: string, ms = 800) {
      setCursor(at(name));
      await sleep(ms);
    }

    async function click() {
      setPressed(true);
      setRipple((n) => n + 1);
      await sleep(150);
      setPressed(false);
      await sleep(200);
    }

    // Drives a value from 0 to 1 frame by frame; pauses with the reel.
    async function tween(ms: number, step: (t: number) => void) {
      const frames = Math.round(ms / 16);
      for (let i = 1; i <= frames; i++) {
        await sleep(16);
        step(i / frames);
      }
    }

    async function zoom(name: string | null, z = 1) {
      if (!name) setCam({ x: W / 2, y: H / 2, z: 1 });
      else {
        const p = at(name);
        // Keep the frame filled: never pan past the scene edges.
        const hx = W / 2 / z;
        const hy = H / 2 / z;
        setCam({ x: Math.min(Math.max(p.x, hx), W - hx), y: Math.min(Math.max(p.y, hy), H - hy), z });
      }
      await sleep(1100);
    }

    // Flash the words red, then collapse them out of the timeline (the ripple).
    async function cut(ids: string[], message: string) {
      setSelected([]);
      setMarked(ids);
      await sleep(450);
      setDeleted((d) => [...d, ...ids]);
      setMarked([]);
      setToast(message);
    }

    function reset() {
      setStatus({ kind: "idle" });
      setSelected([]);
      setMarked([]);
      setDeleted([]);
      setExportP(null);
      setToast(null);
      setCam({ x: W / 2, y: H / 2, z: 1 });
    }

    async function loop() {
      while (alive) {
        reset();
        await sleep(900);

        // 1. Transcribe on-device.
        await move("generate");
        await click();
        setStatus({ kind: "transcribing", p: 0 });
        await zoom("panel", 1.55);
        await tween(2600, (t) => setStatus({ kind: "transcribing", p: easeInOut(t) }));
        setStatus({ kind: "ready" });
        await sleep(1400);
        await zoom(null);

        // 2. Remove every filler word in one click.
        await move("fillers");
        await click();
        await cut(FILLERS, `Removed ${FILLER_COUNT} fillers`);
        await zoom("timeline", 1.6);
        await sleep(900);
        setToast(null);
        await zoom(null);

        // 3. Select a retake like text, delete it, the timeline closes the gap.
        await move(RETAKE[0]);
        await click();
        setSelected([RETAKE[0]]);
        await sleep(250);
        await move(RETAKE[RETAKE.length - 1], 700);
        await click();
        setSelected(RETAKE);
        await sleep(400);
        await move("delete", 700);
        await click();
        await cut(RETAKE, "Cut the retake · 1 undo step");
        await zoom("timeline", 1.6);
        await sleep(900);
        setToast(null);
        await zoom(null);

        // 4. Export, right in the browser.
        await move("export");
        await click();
        setExportP(0);
        await zoom("export-pop", 1.7);
        await tween(2200, (t) => setExportP(easeInOut(t)));
        setExportP(1);
        await sleep(500);
        setToast("interview-final.mp4 saved");
        await sleep(1300);
        setExportP(null);
        setToast(null);
        await zoom(null);
        await sleep(1200);
      }
    }

    loop().catch((e) => {
      if (!(e instanceof Stop)) throw e;
    });
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  // The preview clip pauses with the reel (pause button, reduced motion).
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing]);

  const togglePlay = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const fit = width / W;
  const total = WORDS.reduce((sum, w) => sum + (deleted.includes(w.id) ? 0 : w.dur), 0);
  const ready = status.kind === "ready";

  return (
    <figure
      className={s.reel}
      ref={root}
      aria-label="Product demo: transcribe a video, remove filler words, delete a retake from the text, then export"
    >
      <div className={s.viewport} ref={viewport} style={{ aspectRatio: `${W} / ${H}` }}>
        <div
          className={s.scene}
          ref={scene}
          aria-hidden="true"
          inert
          style={{
            width: W,
            height: H,
            transform: `scale(${fit}) translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`,
          }}
        >
          <div className={s.window}>
            <div className={s.chrome}>
              <span className={s.lights}>
                <i />
                <i />
                <i />
              </span>
              <span className={s.url}>
                <Lock size={11} /> tryopenscript.vercel.app/app/editor
              </span>
            </div>

            <div className={s.app}>
              <div className={s.topbar}>
                <Logo href="#" />
                <span className={s.project}>interview-final</span>
                <span className={s.exportWrap}>
                  <span className={s.btnp} data-demo="export">
                    <Download size={14} /> Export
                  </span>
                  {exportP !== null && (
                    <span className={s.exportPop} data-demo="export-pop">
                      <b>{exportP < 1 ? "Exporting MP4" : "Export complete"}</b>
                      <span className={`${s.bar} ${exportP >= 1 ? s.complete : ""}`}>
                        <span style={{ width: `${exportP * 100}%` }} />
                      </span>
                      <small>
                        {exportP < 1 ? `${Math.round(exportP * 100)}% · rendering in your browser` : "1080p · no watermark"}
                      </small>
                    </span>
                  )}
                </span>
              </div>

              <div className={s.body}>
                <div className={s.preview}>
                  <div className={s.frame}>
                    {/* Stock clip: Pexels 6878208 by cottonbro studio (Pexels license, free for commercial use). */}
                    <video
                      ref={video}
                      className={s.footage}
                      src="/demo/interview.mp4"
                      poster="/demo/interview.jpg"
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="auto"
                    />
                    <span className={s.caption}>Editing video should feel as easy as editing a document.</span>
                  </div>
                </div>

                <div className={s.panel} data-demo="panel">
                  <div className={s.panelHead}>
                    <b>Transcript</b>
                    {ready && (
                      <span className={s.tools}>
                        <span className={s.tb}>
                          <Search size={12} /> Find
                        </span>
                        {!FILLERS.every((id) => deleted.includes(id)) && (
                          <span className={s.tb} data-demo="fillers">
                            <Sparkles size={12} /> Remove {FILLER_COUNT} fillers
                          </span>
                        )}
                        <span className={`${s.tb} ${s.danger}`} data-demo="delete" data-off={selected.length === 0}>
                          Delete {selected.length || ""} words
                        </span>
                      </span>
                    )}
                  </div>

                  {status.kind === "idle" && (
                    <div className={s.empty}>
                      <span className={s.lbl}>Model</span>
                      <span className={s.select}>Tiny · about 40 MB</span>
                      <span className={s.lbl}>Language</span>
                      <span className={s.select}>English</span>
                      <span className={s.btnp} data-demo="generate">
                        Generate transcript
                      </span>
                      <small>Runs on this device. Nothing is uploaded.</small>
                    </div>
                  )}

                  {status.kind === "transcribing" && (
                    <div className={s.empty}>
                      <b>Transcribing on this device · {Math.round(status.p * 100)}%</b>
                      <span className={s.bar}>
                        <span style={{ width: `${status.p * 100}%` }} />
                      </span>
                      <small>Whisper Tiny · English</small>
                    </div>
                  )}

                  {ready && (
                    <p className={s.words}>
                      {WORDS.map((w, i) => {
                        const cls = [
                          s.w,
                          w.kind === "filler" && s.filler,
                          selected.includes(w.id) && s.sel,
                          marked.includes(w.id) && s.marked,
                          deleted.includes(w.id) && s.del,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <span key={w.id} className={cls} data-demo={w.id} style={{ animationDelay: `${i * 18}ms` }}>
                            {w.text}
                          </span>
                        );
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className={s.timeline} data-demo="timeline">
                <div className={s.ruler}>
                  {/* Duration sits beside the label so the timeline zoom keeps it in frame as it drops. */}
                  <span>
                    <Film size={12} /> Timeline <span className={s.duration}>{fmt(total)}</span>
                  </span>
                </div>
                <div className={s.track}>
                  <span className={s.tlabel}>V1</span>
                  <span className={s.clips}>
                    {WORDS.map((w) => (
                      <span
                        key={w.id}
                        className={`${s.slice} ${s.video} ${marked.includes(w.id) ? s.marked : ""}`}
                        style={{ width: deleted.includes(w.id) ? 0 : w.dur * PX_PER_S }}
                      />
                    ))}
                  </span>
                </div>
                <div className={s.track}>
                  <span className={s.tlabel}>A1</span>
                  <span className={s.clips}>
                    {WORDS.map((w) => (
                      <span
                        key={w.id}
                        className={`${s.slice} ${s.audio} ${marked.includes(w.id) ? s.marked : ""}`}
                        style={{ width: deleted.includes(w.id) ? 0 : w.dur * PX_PER_S }}
                      />
                    ))}
                  </span>
                </div>
              </div>

              {toast && (
                <div className={s.toast}>
                  <Check size={14} /> {toast}
                </div>
              )}
            </div>
          </div>

          <div
            className={`${s.cursor} ${pressed ? s.pressed : ""}`}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            {ripple > 0 && <span key={ripple} className={s.ripple} />}
            <svg width="22" height="28" viewBox="0 0 22 28">
              <path
                d="M1.5 1.5v21.2l5.4-5.1 3.5 8.2 3.6-1.6-3.5-8h7.3z"
                fill="#fff"
                stroke="#000"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {/* Looping motion needs a pause control (WCAG 2.2.2); it stays out of sight until hover or keyboard focus. */}
        <button
          className={`${s.play} ${playing ? "" : s.paused}`}
          aria-label={playing ? "Pause demo" : "Play demo"}
          onClick={togglePlay}
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </figure>
  );
}
