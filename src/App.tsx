/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroTransferSection } from './components/HeroTransferSection';
import { TransfersDashboard } from './components/TransfersDashboard';
import { FriendsMessenger } from './components/FriendsMessenger';
import { PublishedFilesSection } from './components/PublishedFilesSection';
import { SettingsView } from './components/SettingsView';
import { SendTransferModal } from './components/SendTransferModal';
import { TransferPortalView } from './components/TransferPortalView';
import { PublishModal } from './components/PublishModal';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { APP_VERSION } from './version';

const AppContent: React.FC = () => {
  const {
    activeTab,
    currentUser,
    activeTransferPortalId,
  } = useApp();

  // Strict scroll position reset: Always start at top on navigation
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;

      const raf = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeTab, activeTransferPortalId]);

  // Strict Login Gate
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-[#1e1f22] text-white">
        <AuthGate />
      </div>
    );
  }

  // If a direct transfer link is accessed (e.g. ?transfer=TR-4912)
  if (activeTransferPortalId) {
    return (
      <div className="min-h-screen bg-[#1e1f22] text-white flex flex-col justify-between">
        <div>
          <Navbar />
          <TransferPortalView transferId={activeTransferPortalId} />
        </div>
        <SendTransferModal />
        <AuthModal />
        <PublishModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Tab Routing */}
        <main className="w-full">
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              {/* Transfer Cockpit Dropzone */}
              <HeroTransferSection />

              {/* Transfers Dashboard (Outbox & Inbox) */}
              <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
                <TransfersDashboard />
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <FriendsMessenger />
            </div>
          )}

          {activeTab === 'published' && (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <PublishedFilesSection />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <SettingsView />
            </div>
          )}
        </main>
      </div>

      {/* Clean Discord-Inspired Grey Footer */}
      <footer className="border-t py-8 px-4 sm:px-6 mt-16 border-[#383a40] bg-[#1e1f22] text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col gap-4 md:flex-row md:items-center md:justify-between font-mono-code text-xs">
          <div className="flex items-center gap-3">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg text-white font-black text-xs"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              N
            </div>
            <div>
              <span className="font-sans font-bold text-white tracking-wider">
                NOIR ARCHIVE
              </span>
              <span className="ml-2 text-neutral-400 text-[11px]">
                High-Speed File & Folder Sharing Platform
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-neutral-400">
            <span>Direct Transfers</span>
            <span>•</span>
            <span>Friend Groups</span>
            <span>•</span>
            <span>Shared Vault</span>
            <span>•</span>
            <span>Discord Grey System</span>
          </div>

          <div className="text-[11px] text-neutral-400">
            © {new Date().getFullYear()} NOIR ARCHIVE • v{APP_VERSION}
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SendTransferModal />
      <AuthModal />
      <PublishModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
