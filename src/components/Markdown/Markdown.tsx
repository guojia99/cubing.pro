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
    <Card
      style={{
        borderRadius: 8,
        minWidth: "100%"
      }}
    >
      <ReactMarkdown
        className={'markdown-body'}
        remarkPlugins={[[remarkGfm, {singleTilde: false}]]}
        components={{
          // img(props) {
          //   return <img {...props} style={{ maxWidth: 30 }} />;
          // },
        }}
      >
        {md}
      </ReactMarkdown>
    </Card>
  )
};

export default Markdown;
