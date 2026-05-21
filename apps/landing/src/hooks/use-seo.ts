import { useEffect } from "react";

const SITE = "https://nibook.noonstudio.africa";
const DEFAULT_IMAGE = `${SITE}/opengraph.jpg`;

type SeoOptions = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function useSeo({ title, description, image, url, type = "website" }: SeoOptions = {}) {
  useEffect(() => {
    const fullTitle = title
      ? `${title} | Nibook`
      : "Nibook — Online Booking for Service Businesses in Kenya";
    const fullDesc =
      description ??
      "Nibook helps service businesses in Kenya manage bookings, clients and payments in one place.";
    const fullImage = image ?? DEFAULT_IMAGE;
    const fullUrl = url ? `${SITE}${url}` : SITE;

    document.title = fullTitle;

    upsertMeta("name", "description", fullDesc);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", "Nibook");
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", fullDesc);
    upsertMeta("property", "og:image", fullImage);
    upsertMeta("property", "og:url", fullUrl);

    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", fullDesc);
    upsertMeta("name", "twitter:image", fullImage);

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", fullUrl);
  }, [title, description, image, url, type]);
}
