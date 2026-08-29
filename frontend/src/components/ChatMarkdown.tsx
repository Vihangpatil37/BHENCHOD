import { useEffect, useRef, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#5B7CFA',
    primaryTextColor: '#FFFFFF',
    primaryBorderColor: '#5B7CFA',
    lineColor: '#70E1FF',
    secondaryColor: '#0A0A0F',
    tertiaryColor: '#10131A',
    fontSize: '14px',
  },
  flowchart: { useMaxWidth: true, htmlLabels: true },
});

function MermaidBlock({ diagram }: { diagram: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!diagram || !ref.current) return;
    mermaid.render(`mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}`, diagram).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = DOMPurify.sanitize(svg);
    });
  }, [diagram, id]);

  return <div ref={ref} className="my-4 flex justify-center w-full overflow-x-auto" />;
}

export function ChatMarkdown({ content }: { content: string }) {
  // If the content is simple text, render it directly to avoid any ReactMarkdown/ESM compatibility layout bugs
  const hasMarkdown = /([#*`_|\[\-]|mermaid)/.test(content || '');
  if (!hasMarkdown) {
    return <p className="whitespace-pre-wrap text-xs text-text-primary leading-relaxed font-medium">{content}</p>;
  }

  try {
    return (
      <div className="prose prose-invert prose-sm max-w-none text-text-primary [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-brand [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:text-sm [&_ul]:space-y-1.5 [&_ul]:mb-3 [&_li]:text-text-secondary [&_hr]:border-white/10 [&_hr]:my-4 [&_strong]:text-text-primary [&_table]:w-full [&_table]:text-xs [&_table]:border-collapse [&_th]:text-left [&_th]:font-bold [&_th]:text-text-secondary [&_th]:pb-2 [&_th]:border-b [&_th]:border-white/10 [&_td]:py-1.5 [&_td]:border-b [&_td]:border-white/5 [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-white/[0.03] [&_pre]:border [&_pre]:border-white/5 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre>code]:bg-transparent [&_pre>code]:p-0 [&_a]:text-brand [&_a]:underline">
        <ReactMarkdown
          components={{
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              if (match && match[1] === 'mermaid') {
                return <MermaidBlock diagram={String(children).replace(/\n$/, '')} />;
              }
              return <code className={className} {...props}>{children}</code>;
            },
            pre({ children }) {
              return <>{children}</>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  } catch (err) {
    console.error("ReactMarkdown rendering error:", err);
    return <p className="whitespace-pre-wrap text-xs text-text-primary leading-relaxed font-medium">{content}</p>;
  }
}
