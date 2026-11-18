"use client";

import { Input } from "antd";
import { useEffect, useState } from "react";
import { useIntlMessage } from "@/hooks/useIntlMessage";
import { markdownEditorResources } from "@/i18n/messages/shared";

import "@wangeditor/editor/dist/css/style.css";
import "./editor_view.css";

import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { i18nAddResources, i18nChangeLanguage } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";

export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (val: string) => void;
}) {
  const { locale, formatMessage: t } = useIntlMessage();
  const [editorLocale, setEditorLocale] = useState<string | null>(null);
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState(value || "<p></p>");

  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: t({ id: "shared.markdown.placeholder" }),
  };

  useEffect(() => {
    i18nAddResources(locale, markdownEditorResources(locale));
    i18nChangeLanguage(locale);
    setEditorLocale(locale);
  }, [locale]);

  useEffect(() => {
    return () => {
      if (editor === null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const handleChange = (nextEditor: IDomEditor) => {
    const newHtml = nextEditor.getHtml();
    setHtml(newHtml);
    onChange?.(newHtml);
  };

  if (editorLocale !== locale) return <p role="status">{t({ id: "shared.markdown.loading" })}</p>;

  return (
    <>
      <div className="markdown-editor" key={editorLocale}>
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: "1px solid var(--border-default)" }}
        />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={handleChange}
          mode="default"
          style={{ height: "500px", overflowY: "hidden" }}
        />
      </div>
      <Input value={html} hidden readOnly />
    </>
  );
}
