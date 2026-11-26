export const cacheTags = {
  posts: "posts",
  contentTypes: "content-types",
  post: (slug: string) => `post:${slug}`,
  comments: (postId: string) => `comments:${postId}`,
  metrics: "metrics",
  siteState: "site-state",
  siteConfig: "site-config",
} as const;
