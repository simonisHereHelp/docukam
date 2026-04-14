import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doc-to-6Ws",
    short_name: "Doc-to-6Ws",
    description: "Capture document images, extract 6W statements, and file them into Google Drive.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
