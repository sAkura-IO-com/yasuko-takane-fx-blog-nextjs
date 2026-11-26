import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { probeImageDimensions } from "@/lib/blog/image-probe";

export const rehypeImgSize: Plugin<[], Root> = () => {
  return async (tree) => {
    const tasks: Promise<void>[] = [];

    visit(tree, "element", (node) => {
      if (node.tagName !== "img") return;

      const props = (node.properties ??= {});
      if (!props.loading) props.loading = "lazy";
      if (!props.decoding) props.decoding = "async";

      if (props.width && props.height) return;

      const src = props.src;
      if (typeof src !== "string" || !src) return;

      tasks.push(
        probeImageDimensions(src).then((dims) => {
          if (!dims) return;
          props.width = dims.width;
          props.height = dims.height;
        }),
      );
    });

    await Promise.all(tasks);
  };
};
