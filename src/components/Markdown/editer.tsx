"use client";

import dynamic from "next/dynamic";

import "./editor_view.css";

const MarkdownEditor = dynamic(
  () => import("./MarkdownEditorCore").then((mod) => mod.MarkdownEditor),
  { ssr: false },
);

export default MarkdownEditor;

export const EditorView = (input: string) => {
  return (
    <div
      className={"editor-content-view"}
      dangerouslySetInnerHTML={{
        __html: input,
      }}
    />
  );
};
