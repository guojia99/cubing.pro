"use client";

import dynamic from "next/dynamic";
import { useIntlMessage } from "@/hooks/useIntlMessage";

import "./editor_view.css";

function EditorLoading() {
  const { formatMessage: t } = useIntlMessage();
  return <p role="status">{t({ id: "shared.markdown.loading" })}</p>;
}

const MarkdownEditor = dynamic(
  () => import("./MarkdownEditorCore").then((mod) => mod.MarkdownEditor),
  { ssr: false, loading: EditorLoading },
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
