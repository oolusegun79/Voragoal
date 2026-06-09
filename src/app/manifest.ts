import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voragoal — 2026 World Cup Analytics",
    short_name: "Voragoal",
    description:
      "An independent analytics platform for the 2026 FIFA World Cup. Schedule, teams, players, stats, and AI-generated insights.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
    orientation: "any",
    categories: ["sports", "news", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
