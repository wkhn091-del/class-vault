import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, Download, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { previewKind, formatBytes } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { Button } from './ui.jsx';
import CodeView from './CodeView.jsx';
import SheetView from './SheetView.jsx';
import OfficeView from './OfficeView.jsx';

/** Groups that need the file's bytes in the browser rather than a URL. */
const NEEDS_TEXT = new Set(['html', 'code', 'text', 'sheet']);
/** Groups the viewers handle themselves; we never fetch these. */
const NEEDS_NOTHING = new Set(['office']);

export default function Previewer({ file, onClose }) {
  const [state, setState] = useState({ status: 'loading' });
  const reduce = useReducedMotion();
  const { t, locale } = useLocale();
  const kind = file ? previewKind(file.mime_type, file.name) : 'none';

  useEffect(() => {
    if (!file) return undefined;
    let cancelled = false;

    if (NEEDS_NOTHING.has(kind)) {
      setState({ status: 'ready' });
      return undefined;
    }

    setState({ status: 'loading' });

    (async () => {
      try {
        if (NEEDS_TEXT.has(kind)) {
          /**
           * Read through our own /raw endpoint rather than the storage URL.
           * Storage can serve an uploaded page as text/plain, and with nosniff
           * the browser then shows source instead of the page — handing the
           * markup to srcdoc takes the response header out of the equation.
           */
          const response = await fetch(api.rawUrl(file.id, file.name));
          if (!response.ok) throw new Error('הקובץ לא נטען.');
          const body = await response.text();
          if (!cancelled) setState({ status: 'ready', body });
          return;
        }

        // Images, PDF, video and audio stream straight from storage: bigger
        // files, and the browser wants byte-range requests for seeking.
        const { url } = await api.fileLink(file.id);
        if (!cancelled) setState({ status: 'ready', url });
      } catch (err) {
        if (!cancelled) setState({ status: 'error', message: err.message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file, kind]);

  useEffect(() => {
    if (!file) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [file, onClose]);

  const ready = state.status === 'ready';

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex flex-col bg-ink/92 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 px-3 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="ltr-run truncate text-[15px] font-semibold text-white">{file.name}</p>
              <p className="tabular text-[13px] text-white/50">{formatBytes(file.size_bytes, locale)}</p>
            </div>

            {ready && (kind === 'html' || kind === 'pdf') && (
              <a
                href={kind === 'html' ? api.rawUrl(file.id, file.name) : state.url}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={t.openInTab}
                className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-[18px] w-[18px]" />
              </a>
            )}
            <a
              href={api.downloadUrl(file.id)}
              aria-label={t.download}
              className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Download className="h-[18px] w-[18px]" />
            </a>
            <button
              onClick={onClose}
              aria-label={t.close}
              className="rounded-xl p-2.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-5xl flex-1 overflow-hidden px-3 pb-3 sm:px-5 sm:pb-5"
          >
            <div className="h-full overflow-auto rounded-2xl bg-surface shadow-lift">
              {state.status === 'loading' && (
                <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-graphite">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{t.opening}…</span>
                </div>
              )}

              {state.status === 'error' && (
                <div className="p-10 text-center text-sm text-graphite">{state.message}</div>
              )}

              {ready && kind === 'image' && (
                <img src={state.url} alt={file.name} className="mx-auto block max-h-full object-contain" />
              )}

              {ready && kind === 'pdf' && (
                <iframe src={state.url} title={file.name} className="h-full min-h-[72vh] w-full" />
              )}

              {ready && kind === 'html' && (
                <iframe
                  srcDoc={state.body}
                  title={file.name}
                  /* No allow-same-origin: the page runs in an opaque origin and
                     cannot read this site, the admin token, or the bucket. */
                  sandbox="allow-scripts allow-popups allow-forms allow-modals"
                  className="h-full min-h-[72vh] w-full bg-white"
                />
              )}

              {ready && kind === 'office' && <OfficeView file={file} />}

              {ready && kind === 'sheet' && <SheetView text={state.body} name={file.name} />}

              {ready && (kind === 'code' || kind === 'text') && (
                <CodeView code={state.body} name={file.name} />
              )}

              {ready && kind === 'video' && (
                <video src={state.url} controls playsInline className="h-full w-full bg-black" />
              )}

              {ready && kind === 'audio' && (
                <div className="flex h-full min-h-[40vh] items-center justify-center p-10">
                  <audio src={state.url} controls className="w-full max-w-lg" />
                </div>
              )}

              {ready && kind === 'none' && (
                <div className="p-12 text-center">
                  <p className="text-[15px] text-graphite">{t.noPreview}</p>
                  <Button className="mt-5" onClick={() => window.location.assign(api.downloadUrl(file.id))}>
                    <Download className="h-4 w-4" />
                    {t.download}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
