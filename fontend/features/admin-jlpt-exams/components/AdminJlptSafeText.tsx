import { createElement, type ReactNode } from 'react';

const formatting = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'ruby',
  'rt',
  'rp',
  'sup',
  'sub',
  'span',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'hr',
]);
const discarded = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'template',
  'noscript',
]);

/** Render a small formatting allowlist as React nodes, with no HTML attributes or URLs. */
export function AdminJlptSafeText({ text, className = '' }: { text: string; className?: string }) {
  const render = (node: Node, key: number): ReactNode => {
    if (node.nodeType === 3) return node.textContent;
    if (node.nodeType !== 1) return null;
    const tag = node.nodeName.toLowerCase();
    if (discarded.has(tag)) return null;
    const children = Array.from(node.childNodes, render);
    if (!formatting.has(tag)) return children;
    return createElement(tag, { key }, ...(tag === 'br' || tag === 'hr' ? [] : children));
  };
  const content =
    typeof DOMParser === 'undefined'
      ? text
      : Array.from(new DOMParser().parseFromString(text, 'text/html').body.childNodes, render);
  return (
    <div
      className={`whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere] [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_pre]:whitespace-pre-wrap ${className}`}
    >
      {content}
    </div>
  );
}
