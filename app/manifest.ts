import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Holiwork — Plan smarter. Do more.",
    short_name: "Holiwork",
    description: "Your AI-powered productivity workspace for tasks, focus plans, calendar events, and reminders.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f8f5ed",
    theme_color: "#142b49",
    categories: ["productivity", "education", "utilities"],
    icons: [
      { src: "/holiwork-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
