export function isAdminEditorRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/posts/") &&
    pathname.length > "/admin/posts/".length
  );
}

export function isAdminSplitEditorRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/admin/posts/") &&
    pathname.length > "/admin/posts/".length
  );
}

export function isAdminNavActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/writing") {
    return (
      pathname === "/admin/writing" ||
      pathname.startsWith("/admin/writing/") ||
      pathname === "/admin/posts" ||
      pathname.startsWith("/admin/posts/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
