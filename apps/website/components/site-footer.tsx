import { ArrowUp } from "lucide-react";
import { GITHUB_URL, NAV, PRODUCT_NAME, TAGLINE, WAITLIST_URL, X_URL } from "@/lib/site";
import { Logo } from "./logo";
import s from "./site-footer.module.css";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <div className={s.brand}>
          <Logo />
          <p className={s.tag}>{TAGLINE}.</p>
          <p className={s.desc}>
            A free, open-source video editor. Your recordings stay on your computer.
          </p>
        </div>

        <nav aria-label="Footer" className={s.nav}>
          <div>
            <h2>Product</h2>
            <ul>
              {NAV.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Get started</h2>
            <ul>
              <li>
                <a href="/app">Open the editor</a>
              </li>
              <li>
                <a href={GITHUB_URL}>Source on GitHub</a>
              </li>
              {WAITLIST_URL && (
                <li>
                  <a href={WAITLIST_URL}>Get launch updates</a>
                </li>
              )}
              <li>
                <a href={X_URL}>Follow on X</a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className={s.bar}>
        <p>
          © {year} {PRODUCT_NAME}. MIT licensed.
        </p>
        <a className={s.top} href="#top">
          <ArrowUp size={16} aria-hidden="true" /> Back to top
        </a>
      </div>
    </footer>
  );
}
