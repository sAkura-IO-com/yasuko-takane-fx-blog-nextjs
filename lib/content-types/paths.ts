const ROOT_SECTION_SLUGS = new Set(["posts", "notes"]);

export function indexPath(sectionSlug: string) {
  if (ROOT_SECTION_SLUGS.has(sectionSlug)) return `/${sectionSlug}`;
  return `/c/${sectionSlug}`;
}

export function postPath(sectionSlug: string, slug: string) {
  return `${indexPath(sectionSlug)}/${slug}`;
}
