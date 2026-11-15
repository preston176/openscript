import {
  Cpu,
  FileVideo,
  Github,
  HardDrive,
  Layers,
  PencilLine,
  Search,
  ShieldCheck,
  Sparkles,
  Type,
  Undo2,
  Upload,
} from "lucide-react";
import { DemoReel } from "@/components/demo-reel";
import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { DESCRIPTION, GITHUB_URL, NAV, PRODUCT_NAME, WAITLIST_URL } from "@/lib/site";
import s from "./page.module.css";

const steps = [
  {
    icon: Upload,
    title: "Drop in a recording",
    text: "Add a video or audio file to the editor. It stays on your computer: nothing is uploaded, and there is no account to make.",
  },
  {
    icon: Type,
    title: "Get the transcript",
    text: "Whisper runs right in your browser and writes down every word with its exact timing. Pick a model and language to suit your clip.",
  },
  {
    icon: PencilLine,
    title: "Edit the words, the video follows",
    text: "Delete a sentence and the timeline cuts it out and closes the gap. Changed your mind? Undo puts it back.",
  },
];

const features = [
  {
    icon: Sparkles,
    title: "Remove filler words",
    text: "OpenScript spots the ums, uhs and you-knows. One click cuts every one of them from the video.",
  },
  {
    icon: PencilLine,
    title: "Fix misheard words",
    text: "Double-click any word to correct the transcript, so your text reads right before you start cutting.",
  },
  {
    icon: Search,
    title: "Find any moment",
    text: "Search the transcript and jump straight to the place in the video where it was said.",
  },
  {
    icon: Undo2,
    title: "Undo anything",
    text: "Every transcript edit is a single undo step, and any cut can be restored with one click.",
  },
  {
    icon: Layers,
    title: "A full timeline when you need it",
    text: "Tracks, effects, masks, keyframes, captions and stickers sit right next to the transcript.",
  },
  {
    icon: FileVideo,
    title: "Export MP4 or WebM",
    text: "Render the finished video in your browser. No upload, no queue, and no watermark.",
  },
];

const local = [
  { icon: HardDrive, title: "Projects and media", text: "Saved in your browser's own storage" },
  { icon: Cpu, title: "Transcription", text: "Whisper runs on your device" },
  { icon: FileVideo, title: "Rendering and export", text: "Encoded in your browser" },
];

const faq = [
  {
    q: "Is OpenScript free?",
    a: "Yes. OpenScript is free and open source under the MIT license, for personal and commercial use. Exports have no watermark.",
  },
  {
    q: "Does my video get uploaded anywhere?",
    a: "No. The editor, the transcription and the export all run in your browser. Your recordings and projects never leave your computer. The only download is the speech model itself, the first time you transcribe.",
  },
  {
    q: "Which languages can it transcribe?",
    a: "English, Spanish, French, German, Italian, Portuguese, Russian, Japanese and Chinese. You can also let it detect the language for you.",
  },
  {
    q: "How accurate is the transcript?",
    a: "That depends on the model you pick. Tiny (about 40 MB) is fast and good for clear speech. Small, Medium and Large v3 Turbo (up to about 800 MB) are more accurate and slower. You can fix any word by double-clicking it.",
  },
  {
    q: "Is this a full Descript replacement?",
    a: "It covers the core idea: edit the video by editing the transcript, plus a full timeline editor. Voice cloning, studio sound and remote recording are not part of it.",
  },
  {
    q: "Can I host it myself?",
    a: "Yes. The whole project is on GitHub, and the editor runs without any backend. The README walks you through running it locally.",
  },
];

// Structured data: the product, plus the FAQ for rich results. "<" is escaped so no string can close the script tag.
const jsonLd = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: PRODUCT_NAME,
    description: DESCRIPTION,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
]).replace(/</g, "\\u003c");

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      <div className={s.top} id="top">
        <header className={s.nav}>
          <Logo />
          <nav aria-label="Main">
            {NAV.map((link) => (
              <a key={link.href} href={link.href.slice(1)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className={s.navCta}>
            <a className={s.github} href={GITHUB_URL}>
              <Github size={16} aria-hidden="true" /> GitHub
            </a>
            <a className="btn primary pill" href="/app">
              Open the editor
            </a>
          </div>
        </header>

        <section className={s.hero}>
          <h1>Edit video by editing the transcript</h1>
          <p className={s.lede}>
            {PRODUCT_NAME} turns your recording into text. Delete a sentence and the cut happens on the timeline. Free,
            open source, and it runs entirely in your browser.
          </p>
          <div className={s.ctas}>
            <a className="btn primary pill lg" href="/app">
              Open the editor, free
            </a>
            <a className="btn outline-primary pill lg" href="#how">
              See how it works
            </a>
          </div>
          <p className={s.note}>
            No sign-up. Your video never leaves your computer.
            {WAITLIST_URL && (
              <>
                {" "}
                <a href={WAITLIST_URL}>Get launch updates</a>
              </>
            )}
          </p>

          <DemoReel />
        </section>
      </div>

      <main>
        <section id="how" className={s.section}>
          <h2>How it works</h2>
          <p className={s.sectionLede}>Transcribe once, then cut your video like a text document.</p>
          <ol className={s.steps}>
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className={s.stepIcon}>
                  <step.icon size={24} aria-hidden="true" />
                </span>
                <span className={s.stepN}>Step {i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className={s.section}>
          <h2>Everything you need to cut a talking video</h2>
          <p className={s.sectionLede}>From a rough recording to a tight edit, without hunting through a waveform.</p>
          <ul className={s.features}>
            {features.map((f) => (
              <li key={f.title}>
                <span className={s.fIcon}>
                  <f.icon size={22} aria-hidden="true" />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="privacy" className={s.section}>
          <div className={s.where}>
            <div className={s.whereText}>
              <span className={s.fIcon}>
                <ShieldCheck size={22} aria-hidden="true" />
              </span>
              <h2>Your video never leaves your computer</h2>
              <p>
                Most transcript editors upload your footage to their servers before you can edit a single word.{" "}
                {PRODUCT_NAME} does every step on your own machine.
              </p>
              <p>That makes it a good fit for client work, interviews and anything you would rather not hand over.</p>
            </div>
            <ul className={s.regions}>
              {local.map((r) => (
                <li key={r.title}>
                  <span className={s.pin}>
                    <r.icon size={20} aria-hidden="true" />
                  </span>
                  <span className={s.rtext}>
                    <strong>{r.title}</strong>
                    <span>{r.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className={`${s.section} ${s.narrow}`}>
          <h2>Frequently asked questions</h2>
          <div className={s.faq}>
            {faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={`${s.section} ${s.narrow}`}>
          <div className={s.final}>
            <h2>Try it on your next recording</h2>
            <p className={s.sectionLede}>Drop in a clip, generate the transcript, and start cutting. No account needed.</p>
            <div className={s.ctas}>
              <a className="btn primary pill lg" href="/app">
                Open the editor, free
              </a>
              <a className="btn outline-primary pill lg" href={GITHUB_URL}>
                <Github size={18} aria-hidden="true" /> Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
