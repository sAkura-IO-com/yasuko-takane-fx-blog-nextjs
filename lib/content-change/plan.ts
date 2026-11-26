import { postPath } from "@/lib/blog/paths";

export type ContentEntity = "post";
export type ContentOperation = "create" | "update" | "delete";

export type ContentChangeEvent = {
  entity: ContentEntity;
  operation: ContentOperation;
  wasLive: boolean;
  isLive: boolean;
  oldSection?: string;
  newSection?: string;
  oldSlug?: string;
  newSlug?: string;
};

export type ContentChangePlan = {
  shouldRun: boolean;
  indexNowPaths: string[];
};

function postPublicPath(section: string | undefined, slug: string) {
  return postPath(section ?? "posts", slug);
}

function isDraftOnly(event: ContentChangeEvent) {
  if (event.operation === "create") return !event.isLive;
  if (event.operation === "update") return !event.wasLive && !event.isLive;
  return false;
}

export function indexNowPathsForEvent(event: ContentChangeEvent): string[] {
  if (isDraftOnly(event)) return [];

  if (event.operation === "create") {
    return event.isLive && event.newSlug
      ? [postPublicPath(event.newSection, event.newSlug)]
      : [];
  }
  if (event.operation === "delete") {
    const slug = event.oldSlug ?? event.newSlug;
    if (!slug) return [];
    return [postPublicPath(event.oldSection ?? event.newSection, slug)];
  }

  const pings: string[] = [];
  if (
    event.wasLive &&
    (!event.isLive ||
      event.newSlug !== event.oldSlug ||
      event.newSection !== event.oldSection)
  ) {
    if (event.oldSlug) {
      pings.push(postPublicPath(event.oldSection, event.oldSlug));
    }
  }
  if (event.isLive && event.newSlug) {
    pings.push(postPublicPath(event.newSection, event.newSlug));
  }
  return pings;
}

export function planContentChange(
  event: ContentChangeEvent,
): ContentChangePlan {
  return {
    shouldRun: !isDraftOnly(event),
    indexNowPaths: indexNowPathsForEvent(event),
  };
}
