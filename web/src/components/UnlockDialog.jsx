import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Button, Field, Modal } from './ui.jsx';
import { useAdmin } from '../context/AdminContext.jsx';
import { useLocale } from '../context/LocaleContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function UnlockDialog({ open, onClose }) {
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { unlock } = useAdmin();
  const { t } = useLocale();
  const toast = useToast();

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await unlock(passcode);
      setPasscode('');
      onClose();
      toast.ok(t.unlocked);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t.unlockTitle}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-hairline bg-raised p-3.5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brass" />
          <p className="text-[14px] leading-relaxed text-graphite">{t.unlockBlurb}</p>
        </div>
        <Field
          label={t.passcode}
          type="password"
          autoFocus
          autoComplete="current-password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder={t.passcodePlaceholder}
        />
        {error && <p className="text-[14px] font-semibold text-danger">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" variant="brass" busy={busy} disabled={!passcode}>
            {t.unlockAction}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
