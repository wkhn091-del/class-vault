import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { FolderPlus, BookOpen, Download, KeyRound, RefreshCw } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import FolderCard from '../components/FolderCard.jsx';
import FolderSettingsDialog from '../components/FolderSettingsDialog.jsx';
import { FolderGridSkeleton } from '../components/Skeletons.jsx';
import { Button, EmptyState, Field, Modal } from '../components/ui.jsx';
import Reveal from '../motion/Reveal.jsx';
import Counter from '../motion/Counter.jsx';
import Marquee from '../motion/Marquee.jsx';
import SubjectDoors from '../components/SubjectDoors.jsx';
import Hero from '../components/Hero.jsx';
import StickyDoorsCta from '../components/StickyDoorsCta.jsx';

const byPinThenName = (a, b) =>
  Number(b.is_pinned) - Number(a.is_pinned) || a.name.localeCompare(b.name, 'he');

const STEP_ICONS = [BookOpen, Download, KeyRound];

export default function Home() {
  const [folders, setFolders] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const { isAdmin } = useAdmin();
  const { t } = useLocale();
  const toast = useToast();
  const reduce = useReducedMotion();

  const applyUpdate = (updated) =>
    setFolders((current) =>
      (current ?? [])
        .map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
        .sort(byPinThenName)
    );

  async function togglePin(folder) {
    const next = !folder.is_pinned;
    applyUpdate({ ...folder, is_pinned: next });
    try {
      const saved = await api.updateFolder(folder.id, { is_pinned: next });
      applyUpdate(saved);
      toast.ok(next ? t.pinnedOn : t.pinnedOff);
    } catch (err) {
      applyUpdate(folder);
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

  const totalFiles = folders?.reduce((sum, f) => sum + f.fileCount, 0) ?? 0;
  const folderCount = folders?.length ?? 0;

  const doorFolders = folders
    ? [...folders]
        .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || b.fileCount - a.fileCount)
        .slice(0, 4)
    : [];
  const doorIds = new Set(doorFolders.map((f) => f.id));
  const archiveFolders = folders ? folders.filter((f) => !doorIds.has(f.id)) : [];

  return (
    <>
      <Hero />

      {/* Action path first: doors immediately under hero */}
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
      {folders?.length === 0 && (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <EmptyState title={t.emptyTitle}>{isAdmin ? t.emptyAdmin : t.emptyStudent}</EmptyState>
        </div>
      )}
      {doorFolders.length > 0 && <SubjectDoors folders={doorFolders} />}

      {doorFolders.length > 0 && <Marquee items={t.marqueeSubjects} />}

      {isAdmin && folders && (
        <div className="mx-auto max-w-5xl px-4 pb-4 sm:px-6">
          <Button variant="brass" onClick={() => setCreating(true)}>
            <FolderPlus className="h-[18px] w-[18px]" />
            {t.newFolder}
          </Button>
        </div>
      )}

      {archiveFolders.length > 0 && (
        <section
          id="archive"
          className="scroll-mt-24 bg-gradient-to-b from-canvas via-raised to-blue/[0.07] px-4 py-12 sm:px-6 sm:py-14"
        >
          <div className="mx-auto max-w-5xl">
            <Reveal>
              <h2 className="font-display text-[28px] text-navy sm:text-[36px]">{t.archiveMoreTitle}</h2>
              <div className="mt-4 h-px w-20 brass-rule" />
              <p className="mt-4 max-w-[48ch] text-[16px] text-graphite">{t.archiveMoreLead}</p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {archiveFolders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={reduce ? false : { opacity: 0, y: 18, rotate: -0.4 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.55,
                    delay: Math.min(index * 0.06, 0.45),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <FolderCard folder={folder} onSettings={setEditing} onTogglePin={togglePin} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wedge: WhatsApp / Drive — Module D, not fake e-com competitors */}
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

      {/* Secondary: proof + how — after the action */}
      {folders && folders.length > 0 && (
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

      {doorFolders.length > 0 && <StickyDoorsCta />}

      <NewFolderDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(folder) =>
          setFolders((current) => [...(current ?? []), folder].sort(byPinThenName))
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
