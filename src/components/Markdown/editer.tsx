'use client';

import { Card } from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

export interface MarkdownEditorProps {
  initialValue?: string;
  title: string;
  onChange?: (markdown: string) => void;
}

export default function MarkdownEditor({
  initialValue = '',
  title = 'md',
  onChange,
}: MarkdownEditorProps) {
  const [editorContent, setEditorContent] = useState(initialValue);
  const [markdownOutput, setMarkdownOutput] = useState('');
  const quillRef = useRef<any>(null);

  const turndownService = new TurndownService();

  useEffect(() => {
    const initialMarkdown = turndownService.turndown(initialValue);
    setMarkdownOutput(initialMarkdown);
    if (onChange) {
      onChange(initialMarkdown);
    }
  }, [initialValue, onChange]);

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    const markdown = turndownService.turndown(content);
    setMarkdownOutput(markdown);
    if (onChange) {
      onChange(markdown);
    }
  };

  // const copyToClipboard = () => {
  //   navigator.clipboard.writeText(markdownOutput).then(() => {
  //     message.success('Markdown copied to clipboard')
  //   }, () => {
  //     message.error('Failed to copy, please try manually')
  //   })
  // }

  return (
    <>
      <Card title={title} style={{ marginTop: '20px', marginBottom: '20px' }}>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{markdownOutput}</pre>
      </Card>

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={editorContent}
        onChange={handleEditorChange}
        style={{ height: '300px', marginBottom: '50px' }}
      />

    </>
  );
}
