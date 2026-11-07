import { ImageResponse } from "next/og";

export const alt = "Sporsify — Gear up. Play harder.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0d12",
          color: "#ffffff",
          padding: 72,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 520,
            height: 520,
            borderRadius: 999,
            background: "rgba(201,242,39,0.18)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: 90,
            width: 300,
            height: 300,
            borderRadius: 999,
            background: "#c9f227",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(-8deg)",
          }}
        >
          <span style={{ color: "#0a0d12", fontSize: 58, fontWeight: 800 }}>PLAY</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "#c9f227",
              color: "#0a0d12",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Sporsify.</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>
          <span style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -4 }}>
            Gear up.
            <br />
            Play harder.
          </span>
          <span style={{ fontSize: 28, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
            Performance sports gear delivered across Bangladesh.
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 20, color: "rgba(255,255,255,0.65)" }}>
          <span style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999 }}>
            Cash on delivery
          </span>
          <span style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999 }}>
            bKash & Nagad
          </span>
          <span style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 999 }}>
            Nationwide delivery
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
