import '@wangeditor/editor/dist/css/style.css'; // 引入 css

import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { useEffect, useState } from 'react';
import {Input} from "antd";

// Boot.registerModule(markdownModule);
function MarkdownEditor({ value, onChange }: { value?: string; onChange?: (val: string) => void }) {
  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const [html, setHtml] = useState(value || '<p></p>');

  const toolbarConfig: Partial<IToolbarConfig> = {};
  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '请输入内容...',
  };

  useEffect(() => {
    return () => {
      if (editor === null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 当编辑器内容发生变化时，更新本地状态和父组件状态
  const handleChange = (editor: IDomEditor) => {
    const newHtml = editor.getHtml();
    setHtml(newHtml);
    onChange?.(newHtml); // 通知外部组件更新
  };

  return (
    <>
      <div style={{ border: '1px solid #ccc', zIndex: 100 }}>
        <Toolbar
          editor={editor}
          defaultConfig={toolbarConfig}
          mode="default"
          style={{ borderBottom: '1px solid #ccc' }}
        />
        <Editor
          defaultConfig={editorConfig}
          value={html}
          onCreated={setEditor}
          onChange={handleChange}
          mode="default"
          style={{ height: '500px', overflowY: 'hidden' }}
        />
      </div>
      <Input value={html} hidden readOnly />
    </>
  );
}

export default MarkdownEditor;
