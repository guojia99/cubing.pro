import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import './rainbow.css';
import "./github-markdown.css";
const Markdown = ({ md }) => {
    return (<ReactMarkdown className={'markdown-body'} remarkPlugins={[[remarkGfm, { singleTilde: false }]]} components={{
        // img(props) {
        //   return <img {...props} style={{ maxWidth: 30 }} />;
        // },
        }}>
      {md}
    </ReactMarkdown>);
};
export default Markdown;
//# sourceMappingURL=Markdown.jsx.map