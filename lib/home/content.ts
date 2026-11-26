import { siteBilibiliUrl, siteEmail, siteGithubUrl } from "@/lib/seo/copy";

export { homeSeo } from "@/lib/seo/copy";

export type HomeLink = {
  label: string;
  href: string;
  icon?: string;
  tint?: string;
};

export const homeProfile = {
  name: "あふぃちゃん",
  role: "FXトレーダー / ブロガー",
  bio: [
    "FXと投資の記録を綴っています。相場のこと、日々の気づき、暮らしのメモをゆるく更新中。",
  ],
  links: [
    { label: "GitHub", href: siteGithubUrl, icon: "github" },
    {
      label: "Bilibili",
      href: siteBilibiliUrl,
      icon: "bilibili",
      tint: "bilibili",
    },
    { label: "メール", href: `mailto:${siteEmail}`, icon: "envelope.fill" },
  ] satisfies HomeLink[],
};
