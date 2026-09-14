import { useEffect, useState } from 'react';
import { Pin, Check } from 'lucide-react';
import { api } from '../lib/api.js';
import { tabColor } from '../lib/format.js';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Button, Field, Modal } from './ui.jsx';

/** Archival tab stock — the same muted range the automatic colours come from. */
const SWATCHES = [
  '#c9a227', '#5e7f73', '#8c5a56', '#4e6585', '#a0763f', '#6b6a8a',
  '#7a8c5a', '#9a5f7e', '#3f6b6b', '#8a8f98',
];

const HEX = /^#[0-9a-fA-F]{6}$/;

export default function FolderSettingsDialog({ folder, open, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(null);
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLocale();
  const toast = useToast();

  // Reset whenever a different folder is opened.
  useEffect(() => {
    if (!folder) return;
    setName(folder.name);
    setDescription(folder.description ?? '');
    setColor(folder.color ?? null);
    setPinned(Boolean(folder.is_pinned));
    setError('');
  }, [folder, open]);

  if (!folder) return null;

  const preview = color ?? tabColor(name || folder.name);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const updated = await api.updateFolder(folder.id, {
        name: name.trim(),
        description: description.trim(),
        color,
        is_pinned: pinned,
      });
      onSaved(updated);
      onClose();
      toast.ok(t.folderUpdated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.folderSettings}>
      <form onSubmit={submit} className="space-y-5">
        <Field label={t.folderName} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Field
          label={t.folderDescription}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.folderDescriptionPlaceholder}
        />

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

            {SWATCHES.map((swatch) => (
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
            <span className="h-9 flex-1 rounded-lg" style={{ backgroundColor: preview }} aria-hidden="true" />
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
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${pinned ? 'bg-brass' : 'bg-hairline'}`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                pinned ? 'translate-x-5 rtl:-translate-x-5' : ''
              }`}
            />
          </span>
        </button>

        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" variant="brass" busy={busy} disabled={!name.trim()}>
            {t.saveChanges}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
