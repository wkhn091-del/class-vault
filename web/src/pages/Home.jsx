import { useEffect, useState } from 'react';
import { BookOpen, Download, KeyRound, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FolderSettingsDialog from '../components/FolderSettingsDialog.jsx';
import NewFolderDialog from '../components/NewFolderDialog.jsx';
import TeacherDesk from '../components/TeacherDesk.jsx';
import StudentVault from '../components/StudentVault.jsx';
import { FolderGridSkeleton } from '../components/Skeletons.jsx';
import { Button, EmptyState } from '../components/ui.jsx';
import Reveal from '../motion/Reveal.jsx';
import Counter from '../motion/Counter.jsx';
import Marquee from '../motion/Marquee.jsx';
import Hero from '../components/Hero.jsx';
import TeacherHero from '../components/TeacherHero.jsx';
import StickyDoorsCta from '../components/StickyDoorsCta.jsx';

/** Keep the server's manual order; only fall back if sort_order is missing. */
const bySortOrder = (a, b) =>
  (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9) || a.name.localeCompare(b.name, 'he');

const STEP_ICONS = [BookOpen, Download, KeyRound];

export default function Home() {
  const [folders, setFolders] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const { isAdmin } = useAdmin();
  const { t } = useLocale();
  const toast = useToast();

  const applyUpdate = (updated) =>
    setFolders((current) =>
      (current ?? [])
        .map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
        .sort(bySortOrder)
    );

  async function togglePin(folder) {
    const next = !folder.is_pinned;
    applyUpdate({ ...folder, is_pinned: next });
    try {
      const saved = await api.updateFolder(folder.id, { is_pinned: next });
      applyUpdate(saved);
    } catch (err) {
      applyUpdate(folder);
      toast.problem(err.message);
    }
  }

  async function reorderFolders(ids) {
    const previous = folders;
    const rank = new Map(ids.map((id, i) => [id, i]));
    setFolders((current) =>
      [...(current ?? [])]
        .map((f) => ({ ...f, sort_order: rank.has(f.id) ? rank.get(f.id) : f.sort_order }))
        .sort(bySortOrder)
    );
    try {
      const saved = await api.reorderFolders(ids);
      setFolders(saved);
      toast.ok(t.folderReordered);
    } catch (err) {
      setFolders(previous);
      toast.problem(err.message);
    }
  }

  function loadFolders() {
    setError('');
    setFolders(null);
    api.listFolders().then(setFolders).catch((err) => setError(err.message));
  }

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const openCreate = () => setCreating(true);
    window.addEventListener('metivta:new-folder', openCreate);
    return () => window.removeEventListener('metivta:new-folder', openCreate);
  }, [isAdmin]);

  const totalFiles = folders?.reduce((sum, f) => sum + f.fileCount, 0) ?? 0;
  const folderCount = folders?.length ?? 0;
  const managedFolders = folders ? [...folders].sort(bySortOrder) : [];

  return (
    <>
      {isAdmin ? (
        <TeacherHero
          folderCount={folderCount}
          fileCount={totalFiles}
          onCreate={() => setCreating(true)}
        />
      ) : (
        <Hero
          folders={folders ?? []}
          folderCount={folderCount}
          fileCount={totalFiles}
        />
      )}

      {error && (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-[15px] font-semibold text-danger">{error}</p>
          <Button variant="quiet" className="mt-3" onClick={loadFolders}>
            <RefreshCw className="h-4 w-4" />
            {t.retryLoad}
          </Button>
        </div>
      )}
      {!folders && !error && (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <FolderGridSkeleton />
        </div>
      )}
      {folders?.length === 0 && !isAdmin && (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <EmptyState title={t.emptyTitle}>{t.emptyStudent}</EmptyState>
        </div>
      )}

      {isAdmin && folders && (
        <TeacherDesk
          folders={managedFolders}
          onCreate={() => setCreating(true)}
          onSettings={setEditing}
          onTogglePin={togglePin}
          onReorder={reorderFolders}
        />
      )}

      {!isAdmin && folders && folders.length > 0 && <StudentVault folders={folders} />}
      {!isAdmin && folders && folders.length > 0 && <Marquee items={t.marqueeSubjects} />}

      {!isAdmin && (
        <section className="px-4 py-12 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="font-display text-[26px] text-navy sm:text-[32px]">{t.wedgeTitle}</h2>
              <p className="mt-2 max-w-[40ch] text-[15px] text-graphite">{t.wedgeLead}</p>
            </Reveal>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {t.wedgeItems.map((row, i) => (
                <Reveal key={row.bad} delay={i * 0.06} y={24}>
                  <article className="overflow-hidden rounded-2xl border border-navy/10 bg-surface shadow-card">
                    <div className="border-b border-hairline bg-danger/[0.06] px-5 py-4">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-danger/80">{row.bad}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-graphite">{row.badBody}</p>
                    </div>
                    <div className="bg-navy/[0.05] px-5 py-4">
                      <p className="text-[12px] font-bold uppercase tracking-wide text-navy">{row.good}</p>
                      <p className="mt-1 text-[14px] leading-relaxed text-graphite">{row.goodBody}</p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {folders && folders.length > 0 && !isAdmin && (
        <section className="border-y border-hairline/80 bg-navy px-4 py-10 text-white sm:px-6 sm:py-12">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3 sm:gap-6">
            <Reveal y={20}>
              <p className="font-display text-[40px] font-bold leading-none sm:text-[48px]">
                <Counter value={folderCount} />
              </p>
              <p className="mt-2 text-[14px] text-white/70">{t.statsFolders}</p>
            </Reveal>
            <Reveal y={20} delay={0.08}>
              <p className="font-display text-[40px] font-bold leading-none sm:text-[48px]">
                <Counter value={totalFiles} />
              </p>
              <p className="mt-2 text-[14px] text-white/70">{t.statsFiles}</p>
            </Reveal>
            <Reveal y={20} delay={0.16}>
              <p className="font-display text-[40px] font-bold leading-none text-brassSoft sm:text-[48px]">
                100%
              </p>
              <p className="mt-2 text-[14px] text-white/70">{t.statsOpen}</p>
            </Reveal>
          </div>
        </section>
      )}

      {!isAdmin && (
        <section className="relative overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brassSoft/35 via-transparent to-navy/[0.04]"
          />
          <div className="relative mx-auto max-w-5xl">
            <Reveal>
              <h2 className="font-display text-[26px] text-navy sm:text-[32px]">{t.howTitle}</h2>
              <p className="mt-2 max-w-[48ch] text-[15px] text-graphite">{t.howLead}</p>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.howSteps.map((step, i) => {
                const Icon = STEP_ICONS[i] || BookOpen;
                const tones = [
                  'border-navy/15 bg-navy/[0.06]',
                  'border-blue/20 bg-blue/[0.08]',
                  'border-brass/30 bg-brassSoft/70',
                ];
                return (
                  <Reveal key={step.title} delay={i * 0.06} y={28}>
                    <article className={`relative h-full rounded-2xl border p-5 shadow-card ${tones[i]}`}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="mt-3 font-display text-[18px] text-navy">{step.title}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-graphite">{step.body}</p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!isAdmin && (
        <section className="px-4 pb-8 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-brass/25 bg-brassSoft/50 px-6 py-8 sm:px-10">
              <p className="text-[13px] font-bold tracking-wide text-brass">{t.tipTitle}</p>
              <p className="mt-2 max-w-[52ch] font-display text-[20px] leading-snug text-navy sm:text-[24px]">
                {t.tipBody}
              </p>
            </div>
          </Reveal>
        </section>
      )}

      {!isAdmin && folders && folders.length > 0 && <StickyDoorsCta />}

      <NewFolderDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(folder) =>
          setFolders((current) =>
            [...(current ?? []), { ...folder, sort_order: (current?.length ?? 0) }].sort(bySortOrder)
          )
        }
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
