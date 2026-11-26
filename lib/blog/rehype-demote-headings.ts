import type { Root, RootContent } from "hast";
import type { Plugin } from "unified";

const HEADING_LEVEL = /^h([1-6])$/;

function demoteHeading(node: Root | RootContent) {
  if (node.type === "element") {
    const matched = HEADING_LEVEL.exec(node.tagName);
    if (matched) {
      const level = Number(matched[1]);
      node.properties = {
        ...node.properties,
        "data-md-level": String(level),
      };
      node.tagName = `h${Math.min(level + 1, 6)}`;
    }
  }
  if ("children" in node) {
    for (const child of node.children) {
      demoteHeading(child);
    }
  }
}

export const rehypeDemoteHeadings: Plugin<[], Root> = () => {
  return (tree) => {
    demoteHeading(tree);
  };
};
