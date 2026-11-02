import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Pin, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import { FOLDER_SWATCHES, tabColor } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field, Modal } from './ui.jsx';

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function NewFolderDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLocale();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setColor(null);
    setPinned(false);
    setError('');
  }, [open]);

  const preview = color ?? tabColor(name.trim() || 'תיקייה');
  const suggestions = t.folderSuggestions || [];

  async function submit(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError('');
    try {
      const folder = await api.createFolder(trimmed, description.trim(), {
        color,
        is_pinned: pinned,
      });
      onCreated?.(folder);
      onClose();
      toast.ok(t.folderCreated(folder.name));
      navigate(`/f/${folder.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.newFolder} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-gradient-to-br from-navy/[0.06] via-surface to-brassSoft/40 p-4">
          <p className="inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wide text-brass">
            <Sparkles className="h-3.5 w-3.5" />
            {t.newFolderPreview}
          </p>
          <div className="relative mt-3 pt-4">
            <span
              aria-hidden="true"
              className="absolute start-0 top-0 h-5 w-[42%] max-w-[140px] rounded-t-[10px]"
              style={{ backgroundColor: preview }}
            />
            <div className="rounded-2xl rounded-ss-none border border-hairline bg-surface p-4 shadow-card">
              <p className="flex items-start gap-1.5 font-display text-[20px] leading-snug text-navy">
                {pinned && <Pin className="mt-1 h-4 w-4 shrink-0 fill-brass text-brass" />}
                <span className="truncate">{name.trim() || t.folderNamePlaceholder}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-[13px] text-graphite">
                {description.trim() || t.folderDescriptionHint}
              </p>
            </div>
          </div>
        </div>

        <Field
          label={t.folderName}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.folderNamePlaceholder}
          maxLength={80}
        />

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setName(label)}
                className={`rounded-full border px-3 py-1 text-[13px] font-semibold transition-colors ${
                  name.trim() === label
                    ? 'border-navy bg-navy text-white'
                    : 'border-hairline bg-raised text-graphite hover:border-navy/30 hover:text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">{t.folderDescription}</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.folderDescriptionPlaceholder}
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl border border-hairline bg-surface px-3.5 py-3 text-[16px] shadow-inset transition-colors placeholder:text-mute focus:border-navy"
          />
          <span className="mt-1.5 block text-[13px] text-graphite">{t.folderDescriptionHint}</span>
        </label>

        <div>
          <span className="mb-2 block text-sm font-semibold text-ink">{t.folderColor}</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setColor(null)}
              className={`rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
                color === null ? 'border-navy bg-navy/[0.08] text-navy' : 'border-hairline text-graphite hover:border-ink/25'
              }`}
            >
              {t.colorAuto}
            </button>
            {FOLDER_SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                aria-label={swatch}
                style={{ backgroundColor: swatch }}
                className={`grid h-8 w-8 place-items-center rounded-lg ring-offset-2 ring-offset-surface transition-all ${
                  color === swatch ? 'ring-2 ring-ink' : 'hover:scale-105'
                }`}
              >
                {color === swatch && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2.5">
            <input
              type="color"
              value={HEX.test(color ?? '') ? color : preview}
              onChange={(e) => setColor(e.target.value)}
              aria-label={t.colorCustom}
              className="h-9 w-12 cursor-pointer rounded-lg border border-hairline bg-surface p-1"
            />
            <input
              value={color ?? ''}
              onChange={(e) => setColor(e.target.value.trim() || null)}
              placeholder={t.colorAuto}
              dir="ltr"
              className="tabular w-32 rounded-lg border border-hairline bg-surface px-3 py-2 text-[14px] focus:border-navy"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-start transition-colors ${
            pinned ? 'border-brass/40 bg-brassSoft/60' : 'border-hairline hover:border-ink/25'
          }`}
        >
          <Pin className={`h-[18px] w-[18px] shrink-0 ${pinned ? 'fill-brass text-brass' : 'text-graphite'}`} />
          <span className="flex-1 text-[15px] font-semibold">{pinned ? t.unpin : t.pin}</span>
          <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${pinned ? 'bg-brass' : 'bg-hairline'}`}>
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                pinned ? 'translate-x-5 rtl:-translate-x-5' : ''
              }`}
            />
          </span>
        </button>

        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" variant="brass" busy={busy} disabled={!name.trim()}>
            {t.createFolder}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
