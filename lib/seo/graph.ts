import { homeProfile } from "@/lib/home/content";
import {
  seoLabels,
  siteDescription,
  siteKnowsAbout,
  siteName,
} from "@/lib/seo/copy";
import { absoluteUrl, siteUrl } from "@/lib/site";

export function websiteId() {
  return absoluteUrl("/#website");
}

export function personId() {
  return absoluteUrl("/#person");
}

export function blogId() {
  return absoluteUrl("/posts#blog");
}

export function homePageId() {
  return absoluteUrl("/#webpage");
}

export function personSameAs() {
  return homeProfile.links
    .map((link) => link.href)
    .filter((href) => href.startsWith("http"));
}

export function personJsonLd() {
  const sameAs = personSameAs();
  return {
    "@type": "Person",
    "@id": personId(),
    name: homeProfile.name,
    url: siteUrl(),
    description: siteDescription,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    knowsAbout: [...siteKnowsAbout],
    image: absoluteUrl("/icon-512.png"),
  };
}

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    name: siteName,
    url: siteUrl(),
    description: siteDescription,
    inLanguage: "ja",
    publisher: { "@id": personId() },
    author: { "@id": personId() },
  };
}

export function blogJsonLd() {
  return {
    "@type": "Blog",
    "@id": blogId(),
    name: seoLabels.blog,
    url: absoluteUrl("/posts"),
    description: siteDescription,
    inLanguage: "ja",
    author: { "@id": personId() },
    publisher: { "@id": personId() },
  };
}

export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [websiteJsonLd(), personJsonLd()],
  };
}
