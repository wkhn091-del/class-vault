import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import UnlockDialog from './components/UnlockDialog.jsx';
import Home from './pages/Home.jsx';
import FolderPage from './pages/FolderPage.jsx';
import { EmptyState } from './components/ui.jsx';
import { useLocale } from './context/LocaleContext.jsx';

export default function App() {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <Header onUnlockClick={() => setUnlockOpen(true)} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/f/:id" element={<FolderPage />} />
          <Route path="*" element={<EmptyState title={t.notFound}>{t.notFoundNote}</EmptyState>} />
        </Routes>
      </main>

      <footer className="border-t border-hairline/80 px-4 py-6 text-center text-[13px] text-mute sm:px-6">
        {t.footer}
      </footer>

      <UnlockDialog open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </div>
  );
}
