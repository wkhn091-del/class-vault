import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FolderPlus } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FolderCard from '../components/FolderCard.jsx';
import FolderSettingsDialog from '../components/FolderSettingsDialog.jsx';
import { FolderGridSkeleton } from '../components/Skeletons.jsx';
import { Button, EmptyState, Field, Modal } from '../components/ui.jsx';

const CLASS_NAME = import.meta.env.VITE_CLASS_NAME || 'ארכיון הכיתה';
const SUBTITLE = import.meta.env.VITE_CLASS_SUBTITLE || 'סיכומים, מבחנים ומצגות — הכול במקום אחד.';

/** Pinned first, then alphabetical — the same order the API returns. */
const byPinThenName = (a, b) =>
  Number(b.is_pinned) - Number(a.is_pinned) || a.name.localeCompare(b.name, 'he');

export default function Home() {
  const [folders, setFolders] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const { isAdmin } = useAdmin();
  const { t } = useLocale();
  const toast = useToast();
  const reduce = useReducedMotion();

  /** Merges an updated folder back in, keeping the counts the list already has. */
  const applyUpdate = (updated) =>
    setFolders((current) =>
      (current ?? [])
        .map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
        .sort(byPinThenName)
    );

  async function togglePin(folder) {
    const next = !folder.is_pinned;
    applyUpdate({ ...folder, is_pinned: next }); // optimistic: the list reorders at once
    try {
      const saved = await api.updateFolder(folder.id, { is_pinned: next });
      applyUpdate(saved);
      toast.ok(next ? t.pinnedOn : t.pinnedOff);
    } catch (err) {
      applyUpdate(folder); // put it back where it was
      toast.problem(err.message);
    }
  }

  useEffect(() => {
    api.listFolders().then(setFolders).catch((err) => setError(err.message));
  }, []);

  const totalFiles = folders?.reduce((sum, f) => sum + f.fileCount, 0) ?? 0;

  return (
    <>
      <section className="mb-10">
        <h1 className="text-[34px] leading-[1.12] sm:text-[46px]">{CLASS_NAME}</h1>
        <div className="mt-4 h-px w-24 brass-rule" />
        <p className="mt-4 max-w-[56ch] text-[17px] leading-relaxed text-graphite">{SUBTITLE}</p>
        {folders && folders.length > 0 && (
          <p className="tabular mt-3 text-[15px] text-mute">
            {t.overview(t.folders(folders.length), t.files(totalFiles))}
          </p>
        )}
      </section>

      {/* Admin controls exist only in admin mode — students get a clean gallery
          with nothing disabled or locked to look at. */}
      {isAdmin && (
        <div className="mb-7">
          <Button variant="brass" onClick={() => setCreating(true)}>
            <FolderPlus className="h-[18px] w-[18px]" />
            {t.newFolder}
          </Button>
        </div>
      )}

      {error && <p className="text-[15px] font-semibold text-danger">{error}</p>}
      {!folders && !error && <FolderGridSkeleton />}

      {folders?.length === 0 && (
        <EmptyState title={t.emptyTitle}>{isAdmin ? t.emptyAdmin : t.emptyStudent}</EmptyState>
      )}

      {folders && folders.length > 0 && (
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder, index) => (
            <motion.div
              key={folder.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.45), ease: [0.22, 1, 0.36, 1] }}
            >
              <FolderCard folder={folder} onSettings={setEditing} onTogglePin={togglePin} />
            </motion.div>
          ))}
        </div>
      )}

      <NewFolderDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(folder) => setFolders((current) => [...(current ?? []), folder].sort(byPinThenName))}
      />

      <FolderSettingsDialog
        folder={editing}
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={applyUpdate}
      />
    </>
  );
}

function NewFolderDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLocale();
  const toast = useToast();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const folder = await api.createFolder(name, description);
      onCreated(folder);
      setName('');
      setDescription('');
      onClose();
      toast.ok(t.folderCreated(folder.name));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.newFolder}>
      <form onSubmit={submit} className="space-y-5">
        <Field
          label={t.folderName}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.folderNamePlaceholder}
        />
        <Field
          label={t.folderDescription}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.folderDescriptionPlaceholder}
          hint={t.folderDescriptionHint}
        />
        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
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
