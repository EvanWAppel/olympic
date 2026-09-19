import type { MetadataRoute } from "next"

/**
 * SEO posture (PRD §12): the public dashboard and case study are indexable;
 * the owner-only and auth surfaces are not. `/login` is additionally noindex'd
 * at the page level so it stays unadvertised.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about"],
      disallow: ["/settings", "/login", "/api/"],
    },
  }
}
