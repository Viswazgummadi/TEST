// src/components/MessageBubble.jsx
import { motion } from "framer-motion";
import { useAdmin } from "../context/AdminContext";
import { FiShare2, FiCopy, FiCheck } from "react-icons/fi";
import { MdPerson } from "react-icons/md";
import { RiRobot2Fill } from "react-icons/ri";
import { useState, Children } from "react";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Helper to sanitize any input into a clean string
const safeString = (value) => {
  if (Array.isArray(value)) return value.map(safeString).join('');
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value?.props?.children) return safeString(value.props.children);
  return String(value ?? '');
};

const unwrapPotentialFullCodeBlock = (text) => {
  if (typeof text !== 'string') return text;
  const fullBlockRegex = /^\s*```(?:[a-zA-Z0-9_.-]+)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;
  const match = text.trim().match(fullBlockRegex);
  return match && match[1] !== undefined ? match[1] : text;
};

// Animated loading dots
const LoadingDots = () => (
  <div className="flex space-x-1 items-center py-1">
    {[0, 0.2, 0.4].map((delay, i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-current rounded-full"
        animate={{ opacity: [0.5, 1, 0.5], y: [0, -2, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay }}
      />
    ))}
  </div>
);

const MessageBubble = ({ message }) => {
  const { isAdmin } = useAdmin();
  const author = message.author;
  const themeColor = isAdmin ? "red" : "cyan";

  const normalBg = "bg-stone-800/15 backdrop-blur-sm";
  const normalText = "text-stone-300";
  const errorBg = "bg-red-900/10 backdrop-blur-sm";
  const errorText = "text-red-200";
  const sysErrorBg = "bg-yellow-700/10 backdrop-blur-sm";
  const sysErrorText = "text-yellow-200";

  let bubbleBackgroundClass = normalBg;
  let currentMessageTextColor = normalText;
  let iconSpecificClasses = "";
  let CurrentIconComponent = null;
  let showLeftAvatar = false;
  let showRightAvatar = false;

  const [copiedStates, setCopiedStates] = useState({});
  let codeBlockIndexCounter = 0;

  if (author === "user") {
    iconSpecificClasses = `bg-${themeColor}-500/20 text-${themeColor}-300`;
    CurrentIconComponent = MdPerson;
    showRightAvatar = true;
  } else if (author === "llm") {
    iconSpecificClasses = `bg-stone-700/50 text-gray-300`;
    CurrentIconComponent = RiRobot2Fill;
    showLeftAvatar = true;
    if (message.isError) {
      bubbleBackgroundClass = errorBg;
      currentMessageTextColor = errorText;
    }
  } else if (author === "system_error") {
    bubbleBackgroundClass = sysErrorBg;
    currentMessageTextColor = sysErrorText;
  }

  const handleCopy = (codeToCopy, blockId) => {
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopiedStates(prev => ({ ...prev, [blockId]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [blockId]: false })), 2000);
    });
  };

  const CodeBlockRenderer = ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match?.[1] || 'text';
    const codeString = safeString(children).replace(/\n$/, '');

    if (inline) {
      return (
        <code className="bg-stone-700/60 text-cyan-400 px-1 py-0.5 rounded text-xs font-mono" {...props}>
          {codeString}
        </code>
      );
    }

    const blockId = `cb-${codeBlockIndexCounter++}`;

    return (
      <pre
        className="relative group my-2 text-sm"
        style={{
          padding: 0,
          margin: 0,
          overflow: 'auto'
        }}
      >
        <button
          onClick={() => handleCopy(codeString, blockId)}
          className="absolute top-2 right-2 p-1.5 bg-stone-700 hover:bg-stone-600 rounded text-xs text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Copy code"
        >
          {copiedStates[blockId] ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
        </button>
        <SyntaxHighlighter
          style={atomDark}
          language={language}
          PreTag="div"
          customStyle={{
            padding: '1em',
            paddingTop: '2.5em',
            borderRadius: '0.375rem',
            backgroundColor: '#282c34',
            margin: '0',
          }}
          codeTagProps={{ style: { fontFamily: "var(--font-mono, monospace)" } }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </pre>
    );
  };

  // Helper to check if a node's child should be a block element
  const isBlockNode = (childNode) => {
    const blockNodeTypesOrTags = ['code', 'list', 'table', 'heading', 'blockquote', 'pre'];
    return (childNode.type && blockNodeTypesOrTags.includes(childNode.type)) ||
      (childNode.tagName && blockNodeTypesOrTags.includes(childNode.tagName));
  };

  // Custom Paragraph Renderer
  const ParagraphRenderer = ({ node, children, ...props }) => {
    // Check if any direct child node from the AST is a block-level element
    const containsBlock = node.children.some(childNode => isBlockNode(childNode));

    if (containsBlock) {
      // If a block element is found, render children directly without wrapping in <p>
      return <>{children}</>;
    }

    // Otherwise, render a normal paragraph with its default props
    return <p {...props}>{children}</p>;
  };

  // Custom List Item Renderer
  const ListItemRenderer = ({ node, children, ...props }) => {
    // Check if any direct child node from the AST is a block-level element that should not be wrapped in <p>
    // In many markdown parsers, content within an LI is implicitly a paragraph unless it's a block.
    // By returning children directly if a block is found, we allow block elements to be direct children of <li>.
    const containsBlock = node.children.some(childNode => isBlockNode(childNode));

    if (containsBlock) {
      return <li {...props}>{children}</li>;
    }

    // If it's just text or inline content, react-markdown might still wrap it in a <p>
    // or keep it as inline. We can render a standard li.
    // The inner content will be handled by the ParagraphRenderer if it generates a <p>.
    return <li {...props}>{children}</li>;
  };

  // Custom Unordered List Renderer
  const ListRenderer = ({ ordered, node, children, ...props }) => {
    // Use the default render function for ul/ol but ensure it works with custom list items.
    // The primary logic for unwrapping will be in the ListItemRenderer and ParagraphRenderer.
    if (ordered) {
      return <ol {...props}>{children}</ol>;
    }
    return <ul {...props}>{children}</ul>;
  };


  let textToRender = message.text;
  if (typeof textToRender !== 'string') {
    textToRender = safeString(textToRender);
  }

  if (author === "llm" && !message.isError) {
    codeBlockIndexCounter = 0; // Reset for each new LLM message.
    textToRender = unwrapPotentialFullCodeBlock(textToRender);
  }

  return (
    <div className={`flex items-start gap-3 w-full ${author === "user" ? "justify-end" : "justify-start"}`}>
      {showLeftAvatar && CurrentIconComponent && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconSpecificClasses} self-start mt-1`}>
          <CurrentIconComponent size={20} />
        </div>
      )}

      <div className={`message-content-wrapper max-w-2xl flex flex-col min-w-0 ${author === "user" ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-xl ${bubbleBackgroundClass} ${currentMessageTextColor}`}>
          {message.isLoading && !textToRender ? (
            <LoadingDots />
          ) : (
            (author === "llm" && !message.isError) ? (
              <div className="prose prose-sm prose-invert max-w-none 
                prose-p:before:content-none prose-p:after:content-none
                prose-headings:mt-3 prose-headings:mb-1
                prose-ul:my-1.5 prose-ol:my-1.5
                prose-li:my-0.5
                prose-blockquote:my-1.5 prose-blockquote:pl-3 prose-blockquote:border-stone-600
                prose-code:font-mono prose-code:text-xs prose-code:bg-stone-700/60 prose-code:text-cyan-400 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-transparent prose-pre:p-0 prose-pre:my-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: CodeBlockRenderer,
                    p: ParagraphRenderer,      // Custom paragraph renderer
                    li: ListItemRenderer,      // Custom list item renderer
                    ul: ListRenderer,          // Custom unordered list renderer
                    ol: ListRenderer           // Custom ordered list renderer (reusing ListRenderer for simplicity)
                  }}
                >
                  {textToRender}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words">{textToRender}</p>
            )
          )}
        </div>

        {author === "llm" && !message.isError && message.traceUrl && (
          <motion.a
            href={message.traceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-2 px-3 py-1 text-xs text-gray-400 rounded-full hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShare2 />
            <span>View Trace</span>
          </motion.a>
        )}
      </div>

      {showRightAvatar && CurrentIconComponent && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconSpecificClasses} self-start mt-1`}>
          <CurrentIconComponent size={20} />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;