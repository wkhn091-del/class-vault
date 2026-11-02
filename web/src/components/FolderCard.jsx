import { Link } from 'react-router-dom';
import { GripVertical, Pin, Settings2 } from 'lucide-react';
import { formatBytes, relativeDate, tabColor } from '../lib/format.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';

/** A folder with a real tab, the way it sits in a filing drawer. */
export default function FolderCard({
  folder,
  onSettings,
  onTogglePin,
  draggable = false,
  dragging = false,
  dragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const colour = folder.color || tabColor(folder.name);
  const { isAdmin } = useAdmin();
  const { t, locale } = useLocale();

  return (
    <div
      className={`group relative pt-[18px] transition ${
        dragging ? 'opacity-45 scale-[0.98]' : ''
      } ${dragOver ? 'ring-2 ring-brass/50 ring-offset-2 ring-offset-canvas rounded-2xl' : ''}`}
      onDragOver={draggable ? onDragOver : undefined}
      onDragLeave={draggable ? onDragLeave : undefined}
      onDrop={draggable ? onDrop : undefined}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute start-0 top-0 h-[22px] w-[46%] max-w-[150px] rounded-t-[12px] transition-all duration-base ease-out group-hover:-top-1 group-hover:h-[28px] motion-reduce:transition-none motion-reduce:group-hover:top-0 motion-reduce:group-hover:h-[22px]"
        style={{ backgroundColor: colour }}
      />

      <Link
        to={`/f/${folder.id}`}
        className="block transition-transform duration-base ease-out hover:-translate-y-1.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
      >
        <article className="relative flex min-h-[148px] flex-col justify-between rounded-2xl rounded-ss-none border border-hairline bg-surface p-5 shadow-card transition-shadow duration-base group-hover:shadow-lift motion-reduce:transition-none">
          <div className={isAdmin ? 'pe-16' : ''}>
            <h2 className="flex items-start gap-1.5 text-[21px] leading-snug">
              {folder.is_pinned && (
                <Pin
                  className="mt-1.5 h-4 w-4 shrink-0 fill-current text-brass"
                  aria-label={t.pinned}
                />
              )}
              <span>{folder.name}</span>
            </h2>
            {folder.description && (
              <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-graphite">
                {folder.description}
              </p>
            )}
          </div>

          <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
            <span className="text-[15px] font-semibold">
              {folder.fileCount === 0 ? t.emptyForNow : t.files(folder.fileCount)}
            </span>
            {folder.fileCount > 0 && (
              <span className="tabular text-[13px] text-mute">
                {formatBytes(folder.totalBytes, locale)} ·{' '}
                {t.addedRelative(relativeDate(folder.updatedAt, t, locale))}
              </span>
            )}
          </div>
        </article>
      </Link>

      {isAdmin && (
        <div className="absolute end-3.5 top-[26px] flex items-center gap-0.5">
          {draggable && (
            <button
              type="button"
              draggable
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              aria-label={t.teacherDragHandle}
              title={t.teacherDragHandle}
              className="cursor-grab rounded-lg p-2 text-mute transition-colors hover:bg-navy/10 hover:text-navy active:cursor-grabbing"
              onClick={(e) => e.preventDefault()}
            >
              <GripVertical className="h-[17px] w-[17px]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onTogglePin(folder)}
            aria-label={folder.is_pinned ? t.unpin : t.pin}
            className={`rounded-lg p-2 transition-colors hover:bg-brass/12 ${
              folder.is_pinned ? 'text-brass' : 'text-mute hover:text-brass'
            }`}
          >
            <Pin className={`h-[17px] w-[17px] ${folder.is_pinned ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onSettings(folder)}
            aria-label={t.folderSettings}
            className="rounded-lg p-2 text-mute transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Settings2 className="h-[17px] w-[17px]" />
          </button>
        </div>
      )}
    </div>
  );
}
