"use client";

import { Check, Copy } from "lucide-react";
import { memo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A fenced code block with its own copy button.
 *
 * The text is read from the rendered DOM rather than from the AST, so it copies
 * exactly what the person can see — including any trailing newline handling
 * react-markdown applied.
 */
function CodeBlock({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.textContent ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked — leave the button unchanged rather than lying.
    }
  }

  return (
    <div className="group/code relative my-3">
      <pre
        ref={ref}
        className="scrollbar-slim bg-muted border-border overflow-x-auto rounded-lg border p-3.5 text-[0.8125rem] leading-relaxed"
      >
        {children}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        aria-label={copied ? "Code copied" : "Copy code"}
        className="bg-card/90 absolute top-2 right-2 opacity-0 transition-opacity group-hover/code:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <Check className="text-brand-strong size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  // Inline code. Inside a <pre> the CSS below strips this back down.
  code: ({ className, children, ...props }) => (
    <code
      className={cn(
        "bg-muted rounded px-1.5 py-0.5 font-mono text-[0.85em]",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-strong underline underline-offset-2"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  h1: ({ children }) => <h3 className="type-heading mt-4 mb-2 first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="type-heading mt-4 mb-2 first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 mb-1.5 font-semibold first:mt-0">{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className="border-brand text-muted-foreground my-3 border-l-2 pl-3.5 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-border my-4" />,
  table: ({ children }) => (
    <div className="scrollbar-slim my-3 overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border border-b px-2.5 py-1.5 font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-border border-b px-2.5 py-1.5">{children}</td>,
};

/** Memoised: streaming re-renders this on every chunk. */
export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: {
  content: string;
}) {
  return (
    <div className="type-body [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
