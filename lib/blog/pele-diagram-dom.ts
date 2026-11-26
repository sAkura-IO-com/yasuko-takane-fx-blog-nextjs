function isPeleSvg(node: Element | null | undefined): boolean {
  if (!node || node.tagName.toLowerCase() !== "svg") return false;
  return node.classList.contains("pele");
}

export function hasPeleSvg(el: Element): boolean {
  for (const child of el.children) {
    if (isPeleSvg(child)) return true;
  }
  return false;
}

export function readPeleSource(el: Element): string {
  const fromAttr = el.getAttribute("data-pele-source");
  if (fromAttr != null && fromAttr.trim()) return fromAttr.trim();
  if (hasPeleSvg(el)) return "";
  return (el.textContent ?? "").trim();
}
