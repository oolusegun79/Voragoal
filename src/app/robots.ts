import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://realgoal.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Don't index auth, profile, admin, or API endpoints.
        disallow: ["/login", "/signup", "/profile", "/admin/", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
