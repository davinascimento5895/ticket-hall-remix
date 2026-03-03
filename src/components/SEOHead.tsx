import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any>;
}

export function SEOHead({ title, description, ogImage, ogType = "website", canonicalUrl, jsonLd }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = `${title} | TicketHall`;
    document.title = fullTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (property.startsWith("og:") || property.startsWith("twitter:")) {
          el.setAttribute("property", property);
        } else {
          el.setAttribute("name", property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
      setMeta("twitter:description", description);
    }
    setMeta("og:title", fullTitle);
    setMeta("twitter:title", fullTitle);
    setMeta("og:type", ogType);
    setMeta("twitter:card", ogImage ? "summary_large_image" : "summary");

    if (ogImage) {
      setMeta("og:image", ogImage);
      setMeta("twitter:image", ogImage);
    }

    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.href = canonicalUrl;
    }

    // JSON-LD
    const existingLd = document.getElementById("seo-jsonld");
    if (existingLd) existingLd.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.id = "seo-jsonld";
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      const ld = document.getElementById("seo-jsonld");
      if (ld) ld.remove();
    };
  }, [title, description, ogImage, ogType, canonicalUrl, jsonLd]);

  return null;
}
