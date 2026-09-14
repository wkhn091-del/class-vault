import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, Loader2 } from 'lucide-react';
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

      // A partial batch reports both halves instead of claiming success.
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
      className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
        dragging ? 'scale-[1.01] border-navy bg-navy/[0.06]' : 'border-hairline bg-surface/60'
      }`}
    >
      <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => send(e.target.files)} />

      {uploading ? (
        <div className="py-1">
          <p className="tabular flex items-center justify-center gap-2 text-[15px] font-semibold">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.uploading} {count > 1 ? `(${count}) ` : ''}· {progress}%
          </p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-hairline">
            <motion.div
              className="h-full rounded-full bg-navy"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            />
          </div>
        </div>
      ) : (
        <>
          <UploadCloud className="mx-auto h-7 w-7 text-mute" aria-hidden="true" />
          <p className="mt-3 text-[15px] text-graphite">{t.dropHere}</p>
          <Button variant="quiet" className="mt-3" onClick={() => inputRef.current?.click()}>
            {t.chooseFiles}
          </Button>
          <p className="mt-3 text-[13px] text-mute">{t.uploadHint}</p>
        </>
      )}
    </div>
  );
}
