"use client";

import { Input } from "antd";
import { useEffect, useState } from "react";

import "@wangeditor/editor/dist/css/style.css";
import "./editor_view.css";

import type { IDomEditor, IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { Editor, Toolbar } from "@wangeditor/editor-for-react";

export function MarkdownEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange?: (val: string) => void;
}) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState(value || "<p></p>");

  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: "请输入内容...",
  };

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

  return (
    <>
      <div style={{ border: "1px solid var(--border-default)", zIndex: 100 }}>
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
