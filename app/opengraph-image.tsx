import { ImageResponse } from "next/og";

export const alt = "Pàdé: meet someone worth meeting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "radial-gradient(circle at 85% 10%, #4a1d4a 0%, #0a0a12 55%)",
          color: "#F6F4FF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="150" height="150" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FF7A45" />
                <stop offset="0.5" stopColor="#FF3D8B" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="32" r="16" fill="none" stroke="url(#g)" strokeWidth="6" />
            <circle cx="40" cy="32" r="16" fill="none" stroke="url(#g)" strokeWidth="6" />
            <path d="M32 18.7a16 16 0 0 1 0 26.6a16 16 0 0 1 0-26.6z" fill="url(#g)" />
          </svg>
          <div style={{ fontSize: 170, fontWeight: 800, letterSpacing: -6 }}>Pàdé</div>
        </div>
        <div style={{ fontSize: 58, marginTop: 30, color: "#F6F4FF" }}>meet someone worth meeting.</div>
        <div
          style={{
            marginTop: 40,
            fontSize: 32,
            display: "flex",
            padding: "14px 30px",
            borderRadius: 999,
            backgroundImage: "linear-gradient(120deg, #FF7A45, #FF3D8B 48%, #8B5CF6)",
            alignSelf: "flex-start",
            fontWeight: 700,
          }}
        >
          DevFest Ibadan · scan, match, pàdé
        </div>
      </div>
    ),
    size,
  );
}
