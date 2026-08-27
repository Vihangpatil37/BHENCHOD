import { useEffect, useRef, useId, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#5B7CFA', // Brand Blue
    primaryTextColor: '#FFFFFF',
    primaryBorderColor: '#5B7CFA',
    lineColor: '#70E1FF', // AI Cyan
    secondaryColor: '#0A0A0F', // bg-secondary
    tertiaryColor: '#10131A', // bg-tertiary
    fontSize: '14px',
  },
  flowchart: { useMaxWidth: false, htmlLabels: true },
});

export interface MermaidProps {
  diagram: string;
}

export function Mermaid({ diagram }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!diagram || !ref.current) return;
    setError(null);
    const renderId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, '')}-${Math.random().toString(36).slice(2, 7)}`;
    const cleanDiagram = diagram.replace(/\r/g, '');
    mermaid.render(renderId, cleanDiagram)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((err) => {
        console.error("Mermaid render error:", err);
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [diagram, id]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div 
        ref={ref} 
        className="my-4 w-full overflow-auto min-h-[100px] flex justify-center [&_svg]:!max-w-none [&_svg]:!h-auto [&_svg]:!w-auto" 
      />
      {error && <div className="text-red-500 text-xs bg-red-500/10 p-2 rounded">Error: {error}</div>}
      <details className="text-xs text-white/50 cursor-pointer">
        <summary>View Source</summary>
        <pre className="p-2 bg-black/20 rounded mt-1 overflow-x-auto">{diagram}</pre>
      </details>
    </div>
  );
}
