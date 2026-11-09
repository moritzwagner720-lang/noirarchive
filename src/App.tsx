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
import { SeasonalBackground } from './components/SeasonalBackground';
import { AvatarEditorModal } from './components/AvatarEditorModal';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { ReportModal } from './components/ReportModal';
import { NoirArchiveLogo } from './components/NoirArchiveLogo';
import { APP_VERSION } from './version';

const AppContent: React.FC = () => {
  const {
    activeTab,
    currentUser,
    activeTransferPortalId,
    isAvatarEditorOpen,
    setIsAvatarEditorOpen,
    activePreviewMedia,
    setActivePreviewMedia,
    activeReportModalPackage,
    setActiveReportModalPackage,
    isRestoringSession,
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

  // Professional Session Restoration Loading State (prevents login screen flicker for returning users)
  if (isRestoringSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1f22] text-white relative overflow-hidden select-none">
        <SeasonalBackground />
        <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute -inset-4 rounded-3xl bg-indigo-500/10 blur-xl animate-pulse" />
            <NoirArchiveLogo size="lg" showText={false} className="relative z-10" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="font-sans font-bold tracking-wider text-sm uppercase text-neutral-200">
              NOIR ARCHIVE
            </span>
          </div>
          <p className="font-sans text-xs text-neutral-400">
            Restoring secure archive session...
          </p>
          <div className="w-48 h-1 bg-[#2b2d31] rounded-full overflow-hidden mt-6 border border-[#383a40]">
            <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Strict Login Gate
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-[#1e1f22] text-white">
        <SeasonalBackground />
        <AuthGate />
      </div>
    );
  }

  // If a direct transfer link is accessed (e.g. ?transfer=TR-4912)
  if (activeTransferPortalId) {
    return (
      <div className="min-h-screen bg-[#1e1f22] text-white flex flex-col justify-between relative">
        <SeasonalBackground />
        <div className="relative z-10">
          <Navbar />
          <TransferPortalView transferId={activeTransferPortalId} />
        </div>
        <SendTransferModal />
        <AuthModal />
        <PublishModal />
        <AvatarEditorModal
          isOpen={isAvatarEditorOpen}
          onClose={() => setIsAvatarEditorOpen(false)}
        />
        <MediaPreviewModal
          file={activePreviewMedia ? {
            id: 'preview',
            name: activePreviewMedia.title,
            url: activePreviewMedia.url,
            size: '',
            type: activePreviewMedia.type === 'image' ? 'image/jpeg' : 'video/mp4',
          } : null}
          onClose={() => setActivePreviewMedia(null)}
        />
        <ReportModal
          packageId={activeReportModalPackage?.id || null}
          packageTitle={activeReportModalPackage?.title}
          onClose={() => setActiveReportModalPackage(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1f22] text-white flex flex-col justify-between relative">
      <SeasonalBackground />
      <div className="relative z-10">
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

      {/* Clean Discord-Inspired Grey Footer with Safety Disclaimers */}
      <footer className="relative z-10 border-t py-8 px-4 sm:px-6 mt-16 border-[#383a40] bg-[#1e1f22] text-neutral-400">
        <div className="mx-auto max-w-7xl space-y-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between font-mono-code text-xs">
            <div className="flex items-center gap-3">
              <NoirArchiveLogo size="sm" showText={false} />
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

          {/* Security & Safety Notice */}
          <div className="pt-4 border-t border-[#383a40]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] font-mono-code text-neutral-400">
            <p className="max-w-3xl leading-relaxed">
              <strong className="text-neutral-300">Safety Notice:</strong> Files and folders may contain viruses or malicious software. Uploaded files are not automatically scanned. Only download files from sources you trust. Never upload passwords, private keys, or sensitive personal information. Always verify a file before opening it.
            </p>
            <span className="shrink-0 text-neutral-400">Encrypted Transport</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SendTransferModal />
      <AuthModal />
      <PublishModal />
      <AvatarEditorModal
        isOpen={isAvatarEditorOpen}
        onClose={() => setIsAvatarEditorOpen(false)}
      />
      <MediaPreviewModal
        file={activePreviewMedia ? {
          id: 'preview',
          name: activePreviewMedia.title,
          url: activePreviewMedia.url,
          size: '',
          type: activePreviewMedia.type === 'image' ? 'image/jpeg' : 'video/mp4',
        } : null}
        onClose={() => setActivePreviewMedia(null)}
      />
      <ReportModal
        packageId={activeReportModalPackage?.id || null}
        packageTitle={activeReportModalPackage?.title}
        onClose={() => setActiveReportModalPackage(null)}
      />
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
