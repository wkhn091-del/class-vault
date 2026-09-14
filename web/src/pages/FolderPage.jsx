import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Trash2, Settings2, Pin } from 'lucide-react';
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

  useEffect(() => {
    setFolder(null);
    setError('');
    api.getFolder(id).then(setFolder).catch((err) => setError(err.message));
  }, [id]);

  const files = useMemo(() => {
    if (!folder) return [];
    const q = query.trim().toLowerCase();
    return q ? folder.files.filter((f) => f.name.toLowerCase().includes(q)) : folder.files;
  }, [folder, query]);

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

  return (
    <>
      {back}

      <div className="mb-8 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="mt-2.5 h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: folder.color || tabColor(folder.name) }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-start gap-2 text-[30px] leading-tight sm:text-[38px]">
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
        <ul className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
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
            />
          ))}
        </ul>
      )}

      <FolderSettingsDialog
        folder={folder}
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={(updated) => setFolder((current) => ({ ...current, ...updated }))}
      />

      <Previewer file={previewing} onClose={() => setPreviewing(null)} />
    </>
  );
}
