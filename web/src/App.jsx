import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import UnlockDialog from './components/UnlockDialog.jsx';
import Home from './pages/Home.jsx';
import FolderPage from './pages/FolderPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import { EmptyState } from './components/ui.jsx';
import { useLocale } from './context/LocaleContext.jsx';

export default function App() {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        {t.skipToContent}
      </a>

      <Header onUnlockClick={() => setUnlockOpen(true)} />

      <main id="main-content" className="w-full flex-1" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/f/:id"
            element={
              <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                <FolderPage />
              </div>
            }
          />
          <Route
            path="/privacy"
            element={
              <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                <LegalPage kind="privacy" />
              </div>
            }
          />
          <Route
            path="/terms"
            element={
              <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                <LegalPage kind="terms" />
              </div>
            }
          />
          <Route
            path="/accessibility"
            element={
              <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                <LegalPage kind="accessibility" />
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
                <EmptyState title={t.notFound}>{t.notFoundNote}</EmptyState>
              </div>
            }
          />
        </Routes>
      </main>

      <SiteFooter />

      <UnlockDialog open={unlockOpen} onClose={() => setUnlockOpen(false)} />
    </div>
  );
}
