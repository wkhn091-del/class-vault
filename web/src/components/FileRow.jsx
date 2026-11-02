import { useState } from 'react';
import {
  Download, Eye, Trash2, FileText, Image, FileType2, Film, Music, Code2, File,
  Table2, Presentation, FileSpreadsheet, FileType, Pencil, Check, X, GripVertical,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatBytes, formatDate, previewKind, extensionOf } from '../lib/format.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function officeIcon(name = '') {
  if (/\.(xls|xlsx|xlsm|ods)$/i.test(name)) return FileSpreadsheet;
  if (/\.(ppt|pptx|odp)$/i.test(name)) return Presentation;
  return FileType;
}
function officeTint(name = '') {
  if (/\.(xls|xlsx|xlsm|ods)$/i.test(name)) return 'bg-[#1D6F42]/12 text-[#1D6F42]';
  if (/\.(ppt|pptx|odp)$/i.test(name)) return 'bg-[#C43E1C]/12 text-[#C43E1C]';
  return 'bg-[#2B579A]/12 text-[#2B579A]';
}

const ICONS = {
  pdf: FileType2, image: Image, html: Code2, video: Film, audio: Music,
  sheet: Table2, code: Code2, text: FileText, none: File,
};
const TINTS = {
  pdf: 'bg-danger/10 text-danger',
  image: 'bg-[#5E7F73]/12 text-[#4B6A5F]',
  html: 'bg-[#A0763F]/12 text-[#8A6534]',
  video: 'bg-[#6B6A8A]/12 text-[#5A5978]',
  audio: 'bg-brass/12 text-brass',
  sheet: 'bg-[#1D6F42]/12 text-[#1D6F42]',
  code: 'bg-navy/10 text-navy',
  text: 'bg-graphite/10 text-graphite',
  none: 'bg-graphite/10 text-graphite',
};

export default function FileRow({
  file,
  onPreview,
  onDeleted,
  onRenamed,
  draggable = false,
  dragging = false,
  dragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const kind = previewKind(file.mime_type, file.name);
  const Icon = kind === 'office' ? officeIcon(file.name) : (ICONS[kind] ?? File);
  const tint = kind === 'office' ? officeTint(file.name) : (TINTS[kind] ?? TINTS.none);
  const { isAdmin } = useAdmin();
  const { t, locale } = useLocale();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(file.name);

  async function remove() {
    if (!window.confirm(t.deleteFileConfirm(file.name))) return;
    setBusy(true);
    try {
      await api.deleteFile(file.id);
      onDeleted(file.id);
      toast.ok(t.deleted);
    } catch (err) {
      toast.problem(err.message);
      setBusy(false);
    }
  }

  async function saveRename() {
    const next = draft.trim();
    if (!next || next === file.name) {
      setRenaming(false);
      setDraft(file.name);
      return;
    }
    setBusy(true);
    try {
      const updated = await api.renameFile(file.id, next);
      onRenamed?.(updated);
      setRenaming(false);
      toast.ok(t.fileRenamed);
    } catch (err) {
      toast.problem(err.message);
    } finally {
      setBusy(false);
    }
  }

  const openable = kind !== 'none';

  return (
    <li
      className={`group flex items-center gap-2 border-b border-hairline/70 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-raised sm:gap-3.5 sm:px-4 ${
        busy ? 'pointer-events-none opacity-40' : ''
      } ${dragging ? 'opacity-45 bg-brassSoft/40' : ''} ${
        dragOver ? 'border-t-2 border-t-brass bg-brassSoft/30' : ''
      }`}
      onDragOver={draggable ? onDragOver : undefined}
      onDragLeave={draggable ? onDragLeave : undefined}
      onDrop={draggable ? onDrop : undefined}
    >
      {draggable && (
        <button
          type="button"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          aria-label={t.fileDragHandle}
          title={t.fileDragHandle}
          className="shrink-0 cursor-grab rounded-lg p-1.5 text-mute transition-colors hover:bg-navy/10 hover:text-navy active:cursor-grabbing"
          onClick={(e) => e.preventDefault()}
        >
          <GripVertical className="h-[18px] w-[18px]" />
        </button>
      )}

      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>

      {renaming ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') {
                setRenaming(false);
                setDraft(file.name);
              }
            }}
            autoFocus
            className="ltr-run min-w-0 flex-1 rounded-lg border border-navy/30 bg-surface px-2.5 py-1.5 text-[15px] font-semibold focus:border-navy"
          />
          <button
            type="button"
            onClick={saveRename}
            aria-label={t.saveChanges}
            className="rounded-xl p-2 text-navy hover:bg-navy/10"
          >
            <Check className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={() => {
              setRenaming(false);
              setDraft(file.name);
            }}
            aria-label={t.cancel}
            className="rounded-xl p-2 text-graphite hover:bg-ink/[0.06]"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openable && onPreview(file)}
          disabled={!openable}
          className="min-w-0 flex-1 text-start disabled:cursor-default"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        >
          <span className="ltr-run block truncate text-[15px] font-semibold leading-tight">{file.name}</span>
          <span className="tabular mt-1 block text-[13px] text-mute">
            {extensionOf(file.name).toUpperCase() || '—'} · {formatBytes(file.size_bytes, locale)} ·{' '}
            {formatDate(file.created_at, locale)}
          </span>
        </button>
      )}

      {!renaming && (
        <div className="flex shrink-0 items-center gap-0.5">
          {openable && (
            <button
              type="button"
              onClick={() => onPreview(file)}
              aria-label={`${t.preview}: ${file.name}`}
              className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-navy/10 hover:text-navy"
            >
              <Eye className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              try {
                await api.download(file.id);
              } catch (err) {
                toast.problem(err.message);
              }
            }}
            aria-label={`${t.download}: ${file.name}`}
            className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-navy/10 hover:text-navy"
          >
            <Download className="h-[18px] w-[18px]" />
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setDraft(file.name);
                  setRenaming(true);
                }}
                aria-label={`${t.rename}: ${file.name}`}
                className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-navy/10 hover:text-navy"
              >
                <Pencil className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                onClick={remove}
                aria-label={`${t.deleteFile}: ${file.name}`}
                className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
