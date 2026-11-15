import { PRODUCT_NAME } from "@/lib/site";

const BARS = [3, 7, 11, 7, 4];

// Mark: a text cursor splicing two waveform clips, i.e. "edit the words, cut the video".
// Plain SVG elements only, so it also renders inside the OG image (next/og).
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size * (36 / 32)} height={size} viewBox="0 0 36 32" aria-hidden="true">
      {[1, 21].map((x) => (
        <g key={x}>
          <rect x={x} y={5} width={14} height={22} rx={1.6} fill="#fff" />
          <path d={`M${x} 16h2M${x + 12} 16h2`} stroke="#000" strokeWidth={0.9} />
          {BARS.map((h, i) => (
            <path
              key={i}
              d={`M${x + 3 + i * 2} ${16 - h / 2}v${h}`}
              stroke="#000"
              strokeWidth={1.1}
              strokeLinecap="round"
            />
          ))}
        </g>
      ))}
      <rect x={14.5} y={1} width={7} height={2.4} rx={1.2} fill="#0070f3" />
      <rect x={17} y={2} width={2} height={28} fill="#0070f3" />
      <rect x={14.5} y={28.6} width={7} height={2.4} rx={1.2} fill="#0070f3" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <a className="logo" href={href} aria-label={`${PRODUCT_NAME} home`}>
      <LogoMark />
      <span>
        Open<span className="logo-script">Script</span>
      </span>
    </a>
  );
}
