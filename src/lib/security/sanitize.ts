import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "del",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "hr",
  "figure",
  "figcaption",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "span",
];

const ALLOWED_ATTR = [
  "href",
  "src",
  "alt",
  "title",
  "class",
  "id",
  "target",
  "rel",
  "width",
  "height",
  "colspan",
  "rowspan",
];

export function sanitizeHtmlContent(content: string): string {
  if (!content) {
    return "";
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORCE_BODY: false,
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

export function sanitizeCommentContent(content: string): string {
  if (!content) {
    return "";
  }

  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).trim();
}
