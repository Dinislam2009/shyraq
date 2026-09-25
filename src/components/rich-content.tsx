"use client";

import "katex/dist/katex.min.css";
import katex from "katex";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char] as string));
}

function renderMath(expr: string, displayMode: boolean) {
  try {
    return katex.renderToString(expr, { throwOnError: false, displayMode });
  } catch {
    return escapeHtml(expr);
  }
}

function renderInline(value: string) {
  const protectedParts: string[] = [];
  let text = value;
  const protect = (html: string) => {
    const token = "@@SHYRAQ_" + protectedParts.length + "@@";
    protectedParts.push(html);
    return token;
  };

  text = text.replace(/\$\$([^$]+)\$\$/g, (_, expr) => protect(renderMath(expr, true)));
  text = text.replace(/\$([^$\n]+)\$/g, (_, expr) => protect(renderMath(expr, false)));

  let html = escapeHtml(text);
  html = html
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>")
    .replace(/\x60([^\x60]+)\x60/g, "<code class=\"rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em]\">$1</code>");

  protectedParts.forEach((part, index) => {
    html = html.replace("@@SHYRAQ_" + index + "@@", part);
  });
  return html;
}

function renderRichHtml(value: string) {
  const source = String(value || "").replace(/\r\n/g, "\n");
  const lines = source.split("\n");
  const parts: string[] = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines: string[] = [];

  for (const line of lines) {
    const fence = line.match(/^\s*\x60\x60\x60(.*)$/);
    if (fence) {
      if (inCode) {
        const languageClass = codeLanguage ? " language-" + escapeHtml(codeLanguage) : "";
        parts.push("<pre class=\"mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-left text-sm leading-6 text-slate-100\"><code class=\"" + languageClass + "\">" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        inCode = false;
        codeLanguage = "";
        codeLines = [];
      } else {
        inCode = true;
        codeLanguage = fence[1].trim().split(/\s+/)[0] || "";
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const content = line.replace(/^\s*[-*]\s+/, "");
      parts.push("<div class=\"flex gap-2\"><span class=\"mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current\"></span><span>" + renderInline(content) + "</span></div>");
      continue;
    }

    if (!line.trim()) {
      parts.push("<div class=\"h-3\"></div>");
      continue;
    }

    parts.push("<div>" + renderInline(line) + "</div>");
  }

  if (inCode && codeLines.length) {
    parts.push("<pre class=\"mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-left text-sm leading-6 text-slate-100\"><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
  }

  return parts.join("");
}

export function RichContent({ content, className = "" }: { content: string; className?: string }) {
  return (
    <div
      className={"whitespace-normal break-words leading-7 " + className}
      dangerouslySetInnerHTML={{ __html: renderRichHtml(content) }}
    />
  );
}
