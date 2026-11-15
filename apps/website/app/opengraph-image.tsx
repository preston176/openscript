import { ImageResponse } from "next/og";
import { PRODUCT_NAME, TAGLINE } from "@/lib/site";

export const alt = `${PRODUCT_NAME}: ${TAGLINE.toLowerCase()}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// A transcript line with the filler words struck out, the product in one picture.
const line: [string, boolean][] = [
  ["Now", false], ["um,", true], ["edit", false], ["the", false], ["words,", false], ["uh,", true],
  ["and", false], ["the", false], ["video", false], ["follows.", false],
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          gap: 36,
          backgroundColor: "#000",
          backgroundImage: "radial-gradient(ellipse at 20% 0%, rgba(0,112,243,0.55), transparent 60%)",
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>{PRODUCT_NAME}</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>{TAGLINE}</div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            padding: "24px 32px",
            borderRadius: 20,
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#fafafa",
            fontSize: 38,
          }}
        >
          {line.map(([word, cut], i) => (
            <span
              key={i}
              style={cut ? { color: "#f43f5e", textDecoration: "line-through", opacity: 0.7 } : {}}
            >
              {word}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.9 }}>Free · Open source · Runs in your browser</div>
      </div>
    ),
    size,
  );
}
