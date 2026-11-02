import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, GripVertical, Search, Trash2, Settings2, Pin } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FileRow from '../components/FileRow.jsx';
import Uploader from '../components/Uploader.jsx';
import Previewer from '../components/Previewer.jsx';
import FolderSettingsDialog from '../components/FolderSettingsDialog.jsx';
import { FileListSkeleton, HeaderSkeleton } from '../components/Skeletons.jsx';
import { Button, EmptyState } from '../components/ui.jsx';
import { formatBytes, tabColor } from '../lib/format.js';

export default function FolderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { t, locale, isRtl } = useLocale();
  const toast = useToast();

  const [folder, setFolder] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [previewing, setPreviewing] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => {
    setFolder(null);
    setError('');
    api.getFolder(id).then(setFolder).catch((err) => setError(err.message));
  }, [id]);

  const searching = Boolean(query.trim());
  const files = useMemo(() => {
    if (!folder) return [];
    const q = query.trim().toLowerCase();
    return q ? folder.files.filter((f) => f.name.toLowerCase().includes(q)) : folder.files;
  }, [folder, query]);

  const canDrag = isAdmin && !searching && (folder?.files.length ?? 0) > 1;
  const totalBytes = folder?.files.reduce((sum, f) => sum + Number(f.size_bytes), 0) ?? 0;
  const BackArrow = isRtl ? ChevronRight : ChevronLeft;

  async function deleteFolder() {
    if (!window.confirm(t.deleteFolderConfirm(folder.name, folder.files.length))) return;
    try {
      await api.deleteFolder(folder.id);
      toast.ok(t.folderDeleted);
      navigate('/');
    } catch (err) {
      toast.problem(err.message);
    }
  }

  async function reorderFiles(ids) {
    const previous = folder;
    const rank = new Map(ids.map((fileId, i) => [fileId, i]));
    setFolder((current) => ({
      ...current,
      files: [...current.files].sort(
        (a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9)
      ),
    }));
    try {
      const saved = await api.reorderFiles(folder.id, ids);
      setFolder((current) => ({ ...current, files: saved }));
      toast.ok(t.fileReordered);
    } catch (err) {
      setFolder(previous);
      toast.problem(err.message);
    }
  }

  function handleDragStart(e, file) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);
    setDraggingId(file.id);
  }

  function handleDragOver(e, file) {
    if (!canDrag || !draggingId || draggingId === file.id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(file.id);
  }

  function handleDragLeave(file) {
    if (overId === file.id) setOverId(null);
  }

  function handleDrop(e, target) {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
    setOverId(null);
    setDraggingId(null);
    if (!sourceId || sourceId === target.id || !canDrag || !folder) return;

    const ids = folder.files.map((f) => f.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(target.id);
    if (from < 0 || to < 0) return;
    const next = [...ids];
    next.splice(from, 1);
    next.splice(to, 0, sourceId);
    reorderFiles(next);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setOverId(null);
  }

  if (error) {
    return (
      <EmptyState title={t.folderMissing}>
        {t.folderMissingNote}{' '}
        <Link to="/" className="font-semibold text-navy underline underline-offset-2">
          {t.backToFolders}
        </Link>
      </EmptyState>
    );
  }

  const back = (
    <Link
      to="/"
      className="-ms-1.5 mb-6 inline-flex items-center gap-1 rounded-xl px-1.5 py-1 text-[15px] font-semibold text-graphite transition-colors hover:text-ink"
    >
      <BackArrow className="h-4 w-4" />
      {t.allFolders}
    </Link>
  );

  if (!folder) {
    return (
      <>
        {back}
        <HeaderSkeleton />
        <div className="mt-8">
          <FileListSkeleton />
        </div>
      </>
    );
  }

  const colour = folder.color || tabColor(folder.name);

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-4 -top-10 h-48 rounded-b-[2rem] opacity-90 sm:-inset-x-6"
        style={{
          background: `linear-gradient(180deg, ${colour}33 0%, transparent 100%)`,
        }}
      />

      <div className="relative">
      {back}

      <div className="mb-8 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-2.5 h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-start gap-2 text-[30px] leading-tight text-navy sm:text-[38px]">
            {folder.is_pinned && (
              <Pin className="mt-3 h-5 w-5 shrink-0 fill-current text-brass" aria-label={t.pinned} />
            )}
            <span>{folder.name}</span>
          </h1>
          {folder.description && (
            <p className="mt-2 max-w-[60ch] text-[16px] leading-relaxed text-graphite">{folder.description}</p>
          )}
          <p className="tabular mt-2.5 text-[15px] text-mute">
            {t.files(folder.files.length)}
            {folder.files.length > 0 && ` · ${formatBytes(totalBytes, locale)} ${t.inTotal}`}
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="quiet" onClick={() => setEditing(true)}>
              <Settings2 className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">{t.folderSettings}</span>
            </Button>
            <Button variant="danger" onClick={deleteFolder}>
              <Trash2 className="h-[18px] w-[18px]" />
              <span className="sr-only sm:not-sr-only">{t.deleteFolder}</span>
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-7">
          <Uploader
            folderId={folder.id}
            onUploaded={(created) =>
              setFolder((current) => ({ ...current, files: [...created, ...current.files] }))
            }
          />
        </div>
      )}

      {folder.files.length > 3 && (
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-mute" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.filterPlaceholder}
            aria-label={t.filterPlaceholder}
            className="w-full rounded-xl border border-hairline bg-surface py-3 pe-4 ps-11 text-[16px] shadow-inset transition-colors placeholder:text-mute focus:border-navy"
          />
        </div>
      )}

      {folder.files.length === 0 ? (
        <EmptyState title={t.emptyFolder}>{isAdmin ? t.emptyFolderAdmin : t.emptyFolderStudent}</EmptyState>
      ) : files.length === 0 ? (
        <EmptyState title={t.noMatches}>{t.noMatchesNote}</EmptyState>
      ) : (
        <>
          {canDrag && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-xl border border-navy/10 bg-surface/90 px-3 py-2 text-[13px] font-semibold text-graphite">
              <GripVertical className="h-4 w-4 text-brass" />
              {t.fileReorderHint}
            </p>
          )}
          <ul className="overflow-hidden rounded-2xl border border-navy/10 bg-gradient-to-b from-surface to-raised shadow-card">
            {files.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                onPreview={setPreviewing}
                onDeleted={(fileId) =>
                  setFolder((current) => ({
                    ...current,
                    files: current.files.filter((f) => f.id !== fileId),
                  }))
                }
                onRenamed={(updated) =>
                  setFolder((current) => ({
                    ...current,
                    files: current.files.map((f) => (f.id === updated.id ? { ...f, ...updated } : f)),
                  }))
                }
                draggable={canDrag}
                dragging={draggingId === file.id}
                dragOver={overId === file.id}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragOver={(e) => handleDragOver(e, file)}
                onDragLeave={() => handleDragLeave(file)}
                onDrop={(e) => handleDrop(e, file)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ul>
        </>
      )}

      <FolderSettingsDialog
        folder={folder}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(updated) => setFolder((current) => ({ ...current, ...updated }))}
      />

      <Previewer file={previewing} onClose={() => setPreviewing(null)} />
      </div>
    </div>
  );
}
