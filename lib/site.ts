import { siteEmail, siteGithubUrl, siteName } from "@/lib/seo/copy";

export {
  siteDescription,
  siteEmail,
  siteGithubUrl,
  siteName,
  siteSubtitle,
} from "@/lib/seo/copy";

export const siteAboutMd = `あふぃちゃんの投資家日記です。
FX・投資の記録、相場の見方、日々の暮らしのメモを綴っています。
## お問い合わせ
- GitHub：${siteGithubUrl}
- メール：${siteEmail}`;

export const siteNowMd = `最近の出来事や制作メモを不定期で更新しています。
`;

export const siteContentUpdatedAt = new Date("2026-11-12T00:00:00.000Z");

export function siteUrl(): string {
  const url = process.env.SITE_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function feedAlternateTypes() {
  return {
    "application/rss+xml": [{ url: "/rss.xml", title: `${siteName} RSS` }],
    "application/atom+xml": [{ url: "/atom.xml", title: `${siteName} Atom` }],
    "text/plain": [
      { url: "/llms.txt", title: `${siteName} llms.txt` },
      { url: "/llms-full.txt", title: `${siteName} llms-full.txt` },
    ],
  };
}
