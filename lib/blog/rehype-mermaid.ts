import type { Element, ElementContent, Root, Text } from "hast";
import { fromHtml } from "hast-util-from-html";
import { render } from "pele";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const PELE_CONTENT_MAX_WIDTH = 672;

const FONT_FAMILY =
  'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"';
const FONT_FAMILY_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

function classList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(/\s+/).filter(Boolean);
  return [];
}

function isMermaidLanguage(className: unknown): boolean {
  return classList(className).some(
    (name) => name === "language-mermaid" || name === "mermaid",
  );
}

function collectText(node: Element | Text): string {
  if (node.type === "text") return node.value;
  return node.children
    .map((child) => {
      if (child.type === "text") return child.value;
      if (child.type === "element") return collectText(child);
      return "";
    })
    .join("");
}

function svgChildrenFromRender(
  source: string,
  idPrefix: string,
): ElementContent[] {
  const { svg } = render(source, {
    idPrefix,
    maxWidth: PELE_CONTENT_MAX_WIDTH,
    fontFamily: FONT_FAMILY,
    fontFamilyMono: FONT_FAMILY_MONO,
    responsive: true,
  });
  const fragment = fromHtml(svg, { fragment: true });
  return fragment.children as ElementContent[];
}

export const rehypeMermaid: Plugin<[], Root> = () => {
  return (tree) => {
    let diagramIndex = 0;
    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "pre" || index == null || !parent) return;

      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code",
      );
      if (!code || !isMermaidLanguage(code.properties?.className)) return;

      const source = collectText(code);
      diagramIndex += 1;
      const idPrefix = `pele-${diagramIndex}`;

      let children: ElementContent[] = [];
      let rendered = false;
      try {
        children = svgChildrenFromRender(source, idPrefix);
        rendered = children.some(
          (child) => child.type === "element" && child.tagName === "svg",
        );
        if (!rendered) children = [];
      } catch {
        children = [];
        rendered = false;
      }

      const replacement: Element = {
        type: "element",
        tagName: "div",
        properties: {
          className: rendered
            ? ["pele-diagram", "pele-diagram--mounted"]
            : ["pele-diagram"],
          dataPeleDiagram: true,
          dataPeleSource: source,
          role: "img",
          ariaLabel: "Mermaid 图",
        },
        children,
      };
      parent.children[index] = replacement;
    });
  };
};
