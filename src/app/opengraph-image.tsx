import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "ScopeSync — Requirements, scope changes and delivery in one traceable workspace.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoPath = path.join(process.cwd(), "public", "brand", "ScopeSync-Blue-Gradient-Full-og.png");
  const logo = await readFile(logoPath);
  const logoDataUrl = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #0F1A33 0%, #05070D 72%)",
          color: "#E8EEFF",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        {/* ImageResponse renders its SVG/HTML image nodes directly; next/image optimization is not available here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="ScopeSync" height={365} src={logoDataUrl} style={{ objectFit: "contain", width: "1095px" }} />
      </div>
    ),
    size,
  );
}
