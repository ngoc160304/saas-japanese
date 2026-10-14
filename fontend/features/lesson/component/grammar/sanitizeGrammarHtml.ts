const allowedTags = new Set([
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
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
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a',
  'span',
  'div',
]);
const discardedTags = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'svg',
  'math',
  'link',
  'meta',
  'base',
  'template',
  'noscript',
]);
const textAlignValues = new Set(['left', 'right', 'center', 'justify']);

export function sanitizeGrammarHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');

  function clean(element: Element) {
    for (const child of Array.from(element.children)) clean(child);
    const tag = element.tagName.toLowerCase();
    if (discardedTags.has(tag)) {
      element.remove();
      return;
    }
    if (!allowedTags.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    const href = tag === 'a' ? element.getAttribute('href') : null;
    const alignment = element instanceof HTMLElement ? element.style.textAlign : '';
    for (const attribute of Array.from(element.attributes)) element.removeAttribute(attribute.name);
    if (href && /^(https?:\/\/|mailto:)/i.test(href)) element.setAttribute('href', href);
    if (textAlignValues.has(alignment)) element.setAttribute('style', `text-align:${alignment}`);
  }

  for (const child of Array.from(document.body.children)) clean(child);
  return document.body.innerHTML;
}
