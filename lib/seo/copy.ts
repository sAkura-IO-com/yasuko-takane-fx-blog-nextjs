export const siteName = "あふぃちゃんの投資家日記";
export const siteShortName = "あふぃちゃん";
export const siteGithubUrl = "https://github.com/sAkura-io-com";
export const siteBilibiliUrl = "https://space.bilibili.com/358071887";
export const siteEmail = "mchaohao159@outlook.com";

export const siteTopics = [
  "FX",
  "投資",
  "トレード",
  "相場分析",
  "リスク管理",
  "資産運用",
] as const;

export const siteKnowsAbout = [
  "FX",
  "投資",
  "トレード",
  "相場分析",
  "リスク管理",
  "資産運用",
  "為替",
] as const;

export const siteDescription = `${siteName}は、FX・投資の実践記録を綴る個人ブログです。相場の見方、トレードの振り返り、リスク管理、日々の暮らしの気づきを、ゆるく更新しています。`;

export const siteSubtitle = siteDescription;

export const seoLabels = {
  home: "ホーム",
  blog: "投資ブログ",
  notes: "ノート",
  postsCrumb: "記事",
  notesCrumb: "ノート",
  notesList: "最新ノート",
  blogHeading: "最新記事",
} as const;

export const homeSeo = {
  title: `${siteName}｜FX・投資の記録`,
  heading: seoLabels.blogHeading,
  description: siteDescription,
  writingListName: seoLabels.blog,
  notesListName: seoLabels.notesList,
} as const;

export const postsIndexSeo = {
  path: "/posts",
  title: `記事一覧｜${siteName}`,
  description: `${siteName}の記事一覧です。FX・投資の実践記録、相場の見方、トレードの振り返りを新しい順に掲載しています。`,
} as const;

export const notesIndexSeo = {
  path: "/notes",
  title: `ノート一覧｜${siteName}`,
  description: `${siteName}のノート一覧です。日々の気づき、設定メモ、短い記録をまとめています。`,
} as const;

export const notFoundSeo = {
  title: "ページが見つかりません",
  description: "お探しのページは存在しないか、移動した可能性があります。",
} as const;
