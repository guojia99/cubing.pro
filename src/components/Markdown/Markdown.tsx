import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import './rainbow.css';
import "./github-markdown.css"
import { Card } from 'antd';

interface MarkdownProps {
  md?: string | undefined
}

const Markdown: React.FC<MarkdownProps> = ({md}) => {

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        components={{}}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
