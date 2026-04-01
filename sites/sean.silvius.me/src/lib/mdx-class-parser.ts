const CLASS_DIRECTIVE_RE = /\[:class="([^"]+)"\]/;

const UNORDERED_LIST_RE = /^[-*]\s+/;
const ORDERED_LIST_RE = /^\d+\.\s+/;

function isListLine(line: string): boolean {
  const trimmed = line.trimStart();
  return UNORDERED_LIST_RE.test(trimmed) || ORDERED_LIST_RE.test(trimmed);
}

function isUnorderedListLine(line: string): boolean {
  return UNORDERED_LIST_RE.test(line.trimStart());
}

export function parseMdxClassDirectives(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const directiveMatch = lines[i].match(CLASS_DIRECTIVE_RE);
    if (!directiveMatch) {
      result.push(lines[i]);
      i++;
      continue;
    }

    const className = directiveMatch[1];

    let listStart = result.length - 1;
    while (listStart > 0 && isListLine(result[listStart - 1])) {
      listStart--;
    }

    if (listStart < result.length && isListLine(result[listStart])) {
      const listLines = result.splice(listStart);
      result.push(`<div className="${className}">`);
      result.push(...listLines);
      result.push("</div>");
    }

    i++;
  }

  return result.join("\n");
}

export function applyListClassDirectives(content: string): string {
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const listLines: string[] = [];
    let isUnordered = false;

    while (i < lines.length && isListLine(lines[i])) {
      const trimmed = lines[i].trimStart();
      isUnordered = isUnorderedListLine(lines[i]);
      const text = trimmed.replace(UNORDERED_LIST_RE, "").replace(ORDERED_LIST_RE, "");
      listLines.push(text);
      i++;
    }

    if (listLines.length === 0) {
      result.push(lines[i]);
      i++;
      continue;
    }

    if (i < lines.length) {
      const directiveMatch = lines[i].match(CLASS_DIRECTIVE_RE);
      if (directiveMatch) {
        const className = directiveMatch[1];
        const tag = isUnordered ? "ul" : "ol";
        result.push(`<${tag} className="${className}">`);
        for (const item of listLines) {
          result.push(`<li>${item}</li>`);
        }
        result.push(`</${tag}>`);
        i++;
        continue;
      }
    }

    for (const item of listLines) {
      const prefix = isUnordered ? "- " : "1. ";
      result.push(`${prefix}${item}`);
    }
  }

  return result.join("\n");
}
