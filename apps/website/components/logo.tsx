import { PRODUCT_NAME } from "@/lib/site";

// Mark: a text caret cutting through a waveform, i.e. "edit the words, cut the video".
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a className="logo" href={href} aria-label={`${PRODUCT_NAME} home`}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--primary)" />
        <path
          d="M7 16h2M11 12v8M15 9v14M21 11v10M25 14v4"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path d="M18 6v20" stroke="#bfdbfe" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      <span>{PRODUCT_NAME}</span>
    </a>
  );
}
