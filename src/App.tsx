/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroTransferSection } from './components/HeroTransferSection';
import { FriendsMessenger } from './components/FriendsMessenger';
import { PublishedFilesSection } from './components/PublishedFilesSection';
import { PublishModal } from './components/PublishModal';
import { PhotoGrid } from './components/PhotoGrid';
import { ProjectsView } from './components/ProjectsView';
import { TransfersDashboard } from './components/TransfersDashboard';
import { ProjectManagement } from './components/ProjectManagement';
import { LightboxModal } from './components/LightboxModal';
import { AuthModal } from './components/AuthModal';
import { SendTransferModal } from './components/SendTransferModal';
import { TransferPortalView } from './components/TransferPortalView';
import { AuthGate } from './components/AuthGate';
import { SwitchAvatarModal } from './components/SwitchAvatarModal';
import {
  Camera,
  Send,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Grid,
  Search,
  Users,
  Sparkles,
  Globe,
  Upload,
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    photos,
    searchQuery,
    setSearchQuery,
    currentUser,
    setAuthModal,
    setIsTransferModalOpen,
    setIsPublishModalOpen,
    activeTransferPortalId,
    theme,
    publishedPackages,
  } = useApp();

  const isLight = theme === 'light';

  // Strict scroll position reset: Always start at the top on load, reload, and internal tab/view navigation
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

      // Reinforced frame to ensure post-layout rendering stays at top
      const raf = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeTab, activeTransferPortalId]);

  // Strict Login Gate: The user must log in before they can do anything in the app
  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <AuthGate />
      </div>
    );
  }

  // If a direct transfer link is accessed (e.g. ?transfer=TR-4912)
  if (activeTransferPortalId) {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isLight ? 'bg-[#fcf8f5] text-stone-900' : 'bg-[#090503] text-white'
        }`}
      >
        <Navbar />
        <TransferPortalView transferId={activeTransferPortalId} />
        <LightboxModal />
        <AuthModal />
        <PublishModal />
        <SwitchAvatarModal />
      </div>
    );
  }


  // Filter photos by search query if any
  const displayedPhotos = searchQuery.trim()
    ? photos.filter(
        p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.exif.camera?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.exif.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : photos;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 flex flex-col justify-between ${
        isLight
          ? 'bg-[#fcf8f5] text-stone-900 selection:bg-[#ff6b00] selection:text-black'
          : 'bg-[#090503] text-white selection:bg-[#ff6b00] selection:text-black'
      }`}
    >
      <div>
        <Navbar />

        {/* Start Page (Explore / Home view) */}
        {activeTab === 'explore' && !searchQuery.trim() && (
          <div>
            {/* 1. Halloween Hero with Full Harvest Moon, bare tree horizon, and macOS window dropzone */}
            <HeroTransferSection />

            {/* 2. Published Community Files Section (Anyone can download!) */}
            <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
              <PublishedFilesSection />
            </section>

            {/* 3. Scroll-Down Option: Add Friends & Peer Chat Messenger with '+' file/folder selector */}
            <div className="border-t border-orange-500/15">
              <FriendsMessenger />
            </div>

            {/* 4. Photography Portfolios & Grid Layout Section */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 border-t border-orange-500/15">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ff6b00] shadow-sm shadow-orange-500/50" />
                    <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#ff6b00] font-bold">
                      NOCTURNAL CURATION
                    </span>
                  </div>
                  <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight">
                    Photography Portfolio Archive
                  </h2>
                  <p className={`mt-1 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                    High-contrast monochrome frames, brutalist monoliths, and eerie nocturnal street shadows.
                  </p>
                </div>
              </div>

              <PhotoGrid photos={displayedPhotos} showControls={true} />
            </section>
          </div>
        )}

        {/* Search Results Notice */}
        {searchQuery.trim() && (
          <div
            className={`border-b px-4 py-3 sm:px-6 ${
              isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-[#120a07] border-orange-500/20'
            }`}
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between font-mono-code text-xs">
              <span>
                Vault results for "<strong className="text-[#ff6b00]">{searchQuery}</strong>" ({displayedPhotos.length} works found)
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#ff6b00] hover:underline"
              >
                Clear Search
              </button>
            </div>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
              <PhotoGrid photos={displayedPhotos} showControls={true} />
            </div>
          </div>
        )}

        {/* Dedicated Views */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {activeTab === 'published' && <PublishedFilesSection />}

          {activeTab === 'projects' && <ProjectsView />}

          {activeTab === 'friends' && <FriendsMessenger />}

          {activeTab === 'transfers' && <TransfersDashboard />}

          {activeTab === 'manage' && <ProjectManagement />}
        </main>
      </div>

      {/* Modern Halloween Footer with dusk amber adaptive palette */}
      <footer
        className={`border-t py-12 px-4 sm:px-6 mt-16 transition-colors ${
          isLight
            ? 'bg-[#f6eee8] border-amber-200/80 text-stone-600'
            : 'bg-[#070302] border-orange-500/20 text-neutral-400'
        }`}
      >
        <div className="mx-auto max-w-7xl flex flex-col gap-6 md:flex-row md:items-center md:justify-between font-mono-code text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b00] shadow-sm shadow-orange-500/50" />
              <span className={`font-sans text-sm font-bold tracking-wider ${isLight ? 'text-stone-900' : 'text-white'}`}>
                NOIR ARCHIVE // HALLOWEEN EDITION
              </span>
            </div>
            <p className="mt-1 text-[11px] opacity-75">
              The photography vault that refuses to die. High-contrast portfolios & open transfers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="text-[#ff6b00] font-semibold">"Cut off one link and two more grow back."</span>
            <span>•</span>
            <span>Public Downloads</span>
            <span>•</span>
            <span>Peer Messenger</span>
            <span>•</span>
            <span>1-of-1 Handles</span>
          </div>

          <div className="text-[11px] opacity-60">
            © {new Date().getFullYear()} NOIR ARCHIVE.
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <LightboxModal />
      <AuthModal />
      <SendTransferModal />
      <PublishModal />
      <SwitchAvatarModal />
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
