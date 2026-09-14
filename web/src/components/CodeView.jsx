import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { highlight } from '../lib/highlight.js';
import { languageOf } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';

const MAX_HIGHLIGHT_CHARS = 300_000; // past this, colouring costs more than it gives

export default function CodeView({ code, name }) {
  const [html, setHtml] = useState(null);
  const [copied, setCopied] = useState(false);
  const { t } = useLocale();
  const language = languageOf(name);

  useEffect(() => {
    let cancelled = false;
    if (code.length > MAX_HIGHLIGHT_CHARS) return undefined;
    highlight(code, language).then((result) => !cancelled && setHtml(result));
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lineCount = code.split('\n').length;

  return (
    <div className="relative h-full">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-hairline bg-raised/95 px-4 py-2 backdrop-blur">
        <span className="tabular text-[13px] font-semibold text-graphite">
          {language === 'plaintext' ? '' : `${language} · `}
          {lineCount.toLocaleString()}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-graphite transition-colors hover:bg-ink/[0.06] hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? t.copied : t.copy}
        </button>
      </div>

      {/* Code is always LTR, whatever direction the interface is in. */}
      <pre className="ltr-run overflow-x-auto p-5 text-[13px] leading-[1.7]" dir="ltr">
        <code
          className="hljs bg-transparent p-0"
          {...(html ? { dangerouslySetInnerHTML: { __html: html } } : { children: code })}
        />
      </pre>
    </div>
  );
}
