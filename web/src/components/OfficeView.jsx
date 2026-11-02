import { useEffect, useState } from 'react';
import { Download, Loader2, Globe } from 'lucide-react';
import { api, apiIsPubliclyReachable } from '../lib/api.js';
import { isOfficeOpenDocument } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from './ui.jsx';

const VIEWERS = {
  microsoft: (url) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
  google: (url) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`,
};

export default function OfficeView({ file }) {
  // Microsoft is more reliable for its own formats; Google for OpenDocument.
  const [viewer, setViewer] = useState(isOfficeOpenDocument(file.name) ? 'google' : 'microsoft');
  const [sourceUrl, setSourceUrl] = useState('');
  const [status, setStatus] = useState('loading');
  const [slow, setSlow] = useState(false);
  const { t } = useLocale();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSourceUrl('');

    (async () => {
      try {
        // Pass the final Supabase signed URL — Google/Microsoft often fail when
        // they have to follow our /api/.../raw redirect (or hit Helmet headers).
        const { url } = await api.fileLink(file.id);
        if (!cancelled) {
          setSourceUrl(url);
          setStatus('ready');
        }
      } catch (err) {
        if (!cancelled) setStatus('error');
        if (!cancelled) toast.problem(err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file.id]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [viewer, file.id, status, sourceUrl]);

  async function handleDownload() {
    try {
      await api.download(file.id);
    } catch (err) {
      toast.problem(err.message);
    }
  }

  if (!apiIsPubliclyReachable) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5 p-10 text-center">
        <Globe className="h-8 w-8 text-mute" />
        <p className="max-w-md text-[15px] leading-relaxed text-graphite">{t.officeNeedsPublic}</p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4" />
          {t.download}
        </Button>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 text-graphite">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">{t.opening}…</span>
      </div>
    );
  }

  if (status === 'error' || !sourceUrl) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5 p-10 text-center">
        <p className="max-w-md text-[15px] leading-relaxed text-graphite">{t.officeFailed}</p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4" />
          {t.download}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[72vh] flex-col">
      <iframe
        key={`${viewer}-${sourceUrl}`}
        src={VIEWERS[viewer](sourceUrl)}
        title={file.name}
        className="w-full flex-1 border-0 bg-white"
        onLoad={() => setSlow(false)}
      />

      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-hairline bg-raised px-4 py-2.5 text-[13px] text-graphite">
        {slow && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        <span>{slow ? t.officeSlow : t.officeHint}</span>
        <button
          type="button"
          onClick={() => setViewer(viewer === 'microsoft' ? 'google' : 'microsoft')}
          className="rounded-lg px-2 py-1 font-semibold text-navy transition-colors hover:bg-navy/10"
        >
          {viewer === 'microsoft' ? t.viewerGoogle : t.viewerMicrosoft}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-navy transition-colors hover:bg-navy/10"
        >
          <Download className="h-3.5 w-3.5" />
          {t.download}
        </button>
      </div>
    </div>
  );
}
