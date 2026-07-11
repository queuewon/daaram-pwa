import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const imageBuffer = await readFile(join(process.cwd(), "public/brand/indigo-gelato-mascot.jpg"));
  const imageSrc = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#4f46e5",
      }}
    >
      <img
        src={imageSrc}
        alt="Indigo Gelato"
        width={size.width}
        height={size.height}
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
      />
    </div>,
    { ...size },
  );
}
