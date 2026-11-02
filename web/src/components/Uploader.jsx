import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Loader2, FileUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button } from './ui.jsx';

export default function Uploader({ folderId, onUploaded }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [count, setCount] = useState(0);
  const { t } = useLocale();
  const toast = useToast();

  async function send(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setCount(files.length);
    setProgress(0);
    try {
      const { uploaded, failed } = await api.uploadFiles(folderId, files, setProgress);
      if (uploaded.length > 0) onUploaded(uploaded);

      if (failed.length === 0) toast.ok(t.uploaded(uploaded.length));
      else {
        toast.problem(t.uploadPartial(uploaded.length, failed.length));
        failed.slice(0, 3).forEach((f) => toast.problem(`${f.name}: ${f.reason}`));
      }
    } catch (err) {
      toast.problem(err.message);
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const uploading = progress !== null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        send(e.dataTransfer.files);
      }}
      className={`relative overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
        dragging
          ? 'scale-[1.01] border-brass bg-brassSoft/50 shadow-lift'
          : 'border-brass/35 bg-gradient-to-br from-surface via-brassSoft/20 to-navy/[0.04]'
      }`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-8 -top-10 h-28 w-28 rounded-full bg-brass/15 blur-2xl"
      />
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => send(e.target.files)} />

      {uploading ? (
        <div className="relative py-1">
          <p className="tabular flex items-center justify-center gap-2 text-[15px] font-semibold text-navy">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.uploading} {count > 1 ? `(${count}) ` : ''}· {progress}%
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-hairline">
            <motion.div
              className="h-full rounded-full bg-gradient-to-l from-navy to-brass"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-navy text-white shadow-card">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 font-display text-[18px] text-navy">{t.dropHereTitle}</p>
          <p className="mt-1 text-[14px] text-graphite">{t.dropHere}</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Button variant="brass" onClick={() => inputRef.current?.click()}>
              <FileUp className="h-4 w-4" />
              {t.chooseFiles}
            </Button>
          </div>
          <p className="mt-3 text-[13px] text-mute">{t.uploadHint}</p>
        </div>
      )}
    </div>
  );
}
