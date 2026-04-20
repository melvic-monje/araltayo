"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => (
          <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        ),
        strong: ({ children }) => (
          <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{children}</strong>
        ),
        em: ({ children }) => (
          <em style={{ color: "var(--text-body)" }}>{children}</em>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-bold mb-2 mt-4 first:mt-0"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}>{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-bold mb-1.5 mt-3 first:mt-0"
            style={{ color: "var(--text-body)" }}>{children}</h3>
        ),
        ul: ({ children }) => (
          <ul className="mb-3 space-y-1 pl-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 space-y-1 pl-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="flex gap-2 text-sm leading-relaxed" style={{ color: "var(--text-body)" }}>
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: "#F59E0B" }} />
            <span>{children}</span>
          </li>
        ),
        code: ({ children, className }) => {
          const isBlock = !!className;
          if (isBlock) {
            return (
              <code className="block text-xs p-3 rounded-xl mb-3 overflow-x-auto"
                style={{
                  background: "rgba(0,0,0,0.15)",
                  color: "var(--accent-cyan)",
                  border: "1px solid rgba(111,192,180,0.15)",
                  fontFamily: "monospace",
                }}>
                {children}
              </code>
            );
          }
          return (
            <code className="px-1.5 py-0.5 rounded text-xs"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "var(--accent-purple)",
                fontFamily: "monospace",
              }}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <>{children}</>,
        blockquote: ({ children }) => (
          <blockquote className="pl-3 my-3 text-sm italic"
            style={{
              borderLeft: "3px solid rgba(245,158,11,0.5)",
              color: "var(--text-muted)",
            }}>
            {children}
          </blockquote>
        ),
        hr: () => (
          <hr className="my-4" style={{ borderColor: "var(--border-card)" }} />
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{
              background: "rgba(245,158,11,0.15)",
              color: "var(--accent-purple)",
              border: "1px solid var(--border-card)",
            }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2"
            style={{
              color: "var(--text-body)",
              border: "1px solid var(--border-subtle)",
            }}>
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
