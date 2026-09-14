import { useEffect, useState } from 'react';
import { Download, Loader2, Globe } from 'lucide-react';
import { api, apiIsPubliclyReachable } from '../lib/api.js';
import { isOfficeOpenDocument } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { Button } from './ui.jsx';

const VIEWERS = {
  microsoft: (url) => `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`,
  google: (url) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`,
};

export default function OfficeView({ file }) {
  // OpenDocument files render more reliably in Google's viewer; Microsoft's
  // is better for its own formats.
  const [viewer, setViewer] = useState(isOfficeOpenDocument(file.name) ? 'google' : 'microsoft');
  const [slow, setSlow] = useState(false);
  const { t } = useLocale();

  const rawUrl = api.rawUrl(file.id, file.name);

  useEffect(() => {
    setSlow(false);
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, [viewer, file.id]);

  /**
   * Both viewers fetch the document from their own servers, which means the
   * API has to be reachable from the public internet. On localhost they will
   * simply spin forever, so say so rather than showing a dead frame.
   */
  if (!apiIsPubliclyReachable) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5 p-10 text-center">
        <Globe className="h-8 w-8 text-mute" />
        <p className="max-w-md text-[15px] leading-relaxed text-graphite">{t.officeNeedsPublic}</p>
        <Button onClick={() => window.location.assign(api.downloadUrl(file.id))}>
          <Download className="h-4 w-4" />
          {t.download}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[72vh] flex-col">
      <iframe
        key={viewer}
        src={VIEWERS[viewer](rawUrl)}
        title={file.name}
        className="w-full flex-1 border-0 bg-white"
        onLoad={() => setSlow(false)}
      />

      {slow && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-hairline bg-raised px-4 py-2.5 text-[13px] text-graphite">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{t.officeSlow}</span>
          <button
            onClick={() => setViewer(viewer === 'microsoft' ? 'google' : 'microsoft')}
            className="rounded-lg px-2 py-1 font-semibold text-navy transition-colors hover:bg-navy/10"
          >
            {viewer === 'microsoft' ? t.viewerGoogle : t.viewerMicrosoft}
          </button>
        </div>
      )}
    </div>
  );
}
