import type { ReactNode } from "react";

function renderInline(source: string): ReactNode[] {
  const pattern = /(\[([^\]]+)\]\((https:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of source.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(source.slice(cursor, start));
    const token = match[0];
    if (match[2] && match[3]) {
      let safeHref: string | null = null;
      try {
        const parsed = new URL(match[3]);
        if (parsed.protocol === "https:") safeHref = parsed.toString();
      } catch {
        safeHref = null;
      }
      nodes.push(safeHref
        ? <a key={index} href={safeHref} target="_blank" rel="noopener noreferrer">{match[2]}</a>
        : match[2]);
    } else if (match[4] || match[5]) {
      nodes.push(<strong key={index}>{match[4] ?? match[5]}</strong>);
    } else if (match[6] || match[7]) {
      nodes.push(<em key={index}>{match[6] ?? match[7]}</em>);
    } else if (match[8]) {
      nodes.push(<code key={index}>{match[8]}</code>);
    } else {
      nodes.push(token);
    }
    cursor = start + token.length;
    index += 1;
  }
  if (cursor < source.length) nodes.push(source.slice(cursor));
  return nodes;
}

function isUnorderedList(line: string) {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedList(line: string) {
  return /^\s*\d+[.)]\s+/.test(line);
}

export function SafeMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim().slice(0, 30);
      index += 1;
      const code: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(<pre key={blocks.length} data-language={language || undefined}><code>{code.join("\n")}</code></pre>);
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      const text = renderInline(heading[2]);
      const key = blocks.length;
      if (heading[1].length === 1) blocks.push(<h2 key={key}>{text}</h2>);
      else if (heading[1].length === 2) blocks.push(<h3 key={key}>{text}</h3>);
      else if (heading[1].length === 3) blocks.push(<h4 key={key}>{text}</h4>);
      else blocks.push(<h5 key={key}>{text}</h5>);
      index += 1;
      continue;
    }

    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      blocks.push(<hr key={blocks.length} />);
      index += 1;
      continue;
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      blocks.push(<blockquote key={blocks.length}>{quote.map((item, i) => <p key={i}>{renderInline(item)}</p>)}</blockquote>);
      continue;
    }

    if (isUnorderedList(line) || isOrderedList(line)) {
      const ordered = isOrderedList(line);
      const items: string[] = [];
      while (index < lines.length && (ordered ? isOrderedList(lines[index]) : isUnorderedList(lines[index]))) {
        items.push(lines[index].replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/, ""));
        index += 1;
      }
      const children = items.map((item, i) => <li key={i}>{renderInline(item)}</li>);
      blocks.push(ordered ? <ol key={blocks.length}>{children}</ol> : <ul key={blocks.length}>{children}</ul>);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,4})\s+/.test(lines[index]) &&
      !/^\s*>/.test(lines[index]) &&
      !/^\s*```/.test(lines[index]) &&
      !/^\s*(---+|\*\*\*+)\s*$/.test(lines[index]) &&
      !isUnorderedList(lines[index]) &&
      !isOrderedList(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={blocks.length}>{renderInline(paragraph.join(" "))}</p>);
  }

  return <div className="knowledge-prose">{blocks}</div>;
}
