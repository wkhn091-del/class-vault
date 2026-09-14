import { useState } from 'react';
import {
  Download, Eye, Trash2, FileText, Image, FileType2, Film, Music, Code2, File,
  Table2, Presentation, FileSpreadsheet, FileType,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { formatBytes, formatDate, previewKind, extensionOf } from '../lib/format.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Office files get their own icon and tint per application, the way the
    desktop does it — a spreadsheet should never look like a slide deck. */
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

export default function FileRow({ file, onPreview, onDeleted }) {
  const kind = previewKind(file.mime_type, file.name);
  const Icon = kind === 'office' ? officeIcon(file.name) : (ICONS[kind] ?? File);
  const tint = kind === 'office' ? officeTint(file.name) : (TINTS[kind] ?? TINTS.none);
  const { isAdmin } = useAdmin();
  const { t, locale } = useLocale();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

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

  const openable = kind !== 'none';

  return (
    <li
      className={`group flex items-center gap-3.5 border-b border-hairline/70 px-3 py-3.5 transition-colors last:border-b-0 hover:bg-raised sm:px-4 ${busy ? 'pointer-events-none opacity-40' : ''}`}
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tint}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>

      <button
        onClick={() => openable && onPreview(file)}
        disabled={!openable}
        className="min-w-0 flex-1 text-start disabled:cursor-default"
      >
        <span className="ltr-run block truncate text-[15px] font-semibold leading-tight">{file.name}</span>
        <span className="tabular mt-1 block text-[13px] text-mute">
          {extensionOf(file.name).toUpperCase() || '—'} · {formatBytes(file.size_bytes, locale)} ·{' '}
          {formatDate(file.created_at, locale)}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        {openable && (
          <button
            onClick={() => onPreview(file)}
            aria-label={`${t.preview}: ${file.name}`}
            className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-navy/10 hover:text-navy"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
        )}
        <a
          href={api.downloadUrl(file.id)}
          aria-label={`${t.download}: ${file.name}`}
          className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-navy/10 hover:text-navy"
        >
          <Download className="h-[18px] w-[18px]" />
        </a>
        {isAdmin && (
          <button
            onClick={remove}
            aria-label={`${t.deleteFile}: ${file.name}`}
            className="rounded-xl p-2.5 text-graphite transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
    </li>
  );
}
