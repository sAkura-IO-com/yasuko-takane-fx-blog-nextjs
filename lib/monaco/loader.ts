import { loader } from "@monaco-editor/react";

loader.config({
  paths: { vs: "/monaco/vs" },
  "vs/nls": { availableLanguages: { "*": "zh-cn" } },
});

export function preloadMonaco(): void {
  void loader.init().catch((error) => {
    if (error?.type !== "cancelation") {
      console.error("Monaco preload error:", error);
    }
  });
}
