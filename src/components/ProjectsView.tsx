import React from 'react';
import { useApp } from '../context/AppContext';
import { PhotoGrid } from './PhotoGrid';
import {
  FolderOpen,
  Send,
  ArrowLeft,
  Camera,
  Layers,
  Sparkles,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { Project } from '../types';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    photos,
    users,
    selectedProject,
    setSelectedProject,
    openTransferModalForProject,
    selectedPhotographer,
    setSelectedPhotographer,
    setActiveTab,
    setActiveChatFriend,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  // If a specific project is selected, show that project's curated album
  if (selectedProject) {
    const projectPhotos = photos.filter(p => p.projectId === selectedProject.id);
    const author = users.find(u => u.id === selectedProject.userId);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Back link */}
        <button
          onClick={() => setSelectedProject(null)}
          className={`mb-6 flex items-center gap-1.5 font-mono-code text-xs transition-colors ${
            isLight ? 'text-stone-600 hover:text-stone-950' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Projects</span>
        </button>

        {/* Project Header Banner */}
        <div className={`mb-10 border-b pb-8 transition-colors ${isLight ? 'border-amber-200' : 'border-orange-500/15'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest text-[#ff6b00] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                <span>ARCHIVAL PORTFOLIO</span>
                <span>•</span>
                <span>{selectedProject.category}</span>
                <span>•</span>
                <span>{projectPhotos.length} NEGATIVES</span>
              </div>

              <h1 className={`mt-2 font-editorial text-3xl font-bold tracking-tight sm:text-4xl ${
                isLight ? 'text-stone-900' : 'text-white'
              }`}>
                {selectedProject.title}
              </h1>

              <p className={`mt-3 text-sm leading-relaxed ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                {selectedProject.description}
              </p>

              {author && (
                <div
                  onClick={() => {
                    setSelectedPhotographer(author);
                    setActiveChatFriend(author.username);
                    setActiveTab('friends');
                  }}
                  className={`mt-4 inline-flex items-center gap-2.5 rounded-lg border px-3 py-1.5 cursor-pointer transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-white text-stone-900 hover:border-[#ff6b00] shadow-sm'
                      : 'border-orange-500/30 bg-[#160d09] text-white hover:border-[#ff6b00]'
                  }`}
                >
                  <img
                    src={author.avatar}
                    alt={`@${author.username}`}
                    className="h-6 w-6 grayscale object-cover rounded-full ring-1 ring-orange-500/50"
                  />
                  <span className="font-mono-code text-xs font-semibold text-[#ff6b00]">
                    @{author.username}
                  </span>
                </div>
              )}
            </div>

            {/* Send Folder Shortcut */}
            <div className="shrink-0">
              <button
                onClick={() => openTransferModalForProject(selectedProject)}
                className="flex items-center gap-2 rounded-lg bg-[#ff6b00] px-5 py-2.5 text-xs font-bold tracking-wider uppercase text-black hover:bg-[#ff7d1f] shadow-md shadow-orange-950/20 transition-all hover:scale-105 active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Folder to Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* The Photos in this project */}
        <PhotoGrid photos={projectPhotos} showControls={true} />
      </div>
    );
  }

  // Otherwise, list of all projects / albums
  const displayedProjects = selectedPhotographer
    ? projects.filter(p => p.userId === selectedPhotographer.id)
    : projects;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className={`mb-8 border-b pb-6 transition-colors ${isLight ? 'border-amber-200' : 'border-orange-500/15'}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest text-[#ff6b00] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
              <span>PORTFOLIO DIRECTORY</span>
            </div>
            <h1 className={`mt-1 font-editorial text-2xl font-bold sm:text-3xl ${
              isLight ? 'text-stone-900' : 'text-white'
            }`}>
              Curated Photography Projects
            </h1>
            <p className={`mt-1 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
              Browse thematic series, architectural studies, and darkroom collections.
            </p>
          </div>

          {selectedPhotographer && (
            <button
              onClick={() => setSelectedPhotographer(null)}
              className={`font-mono-code text-xs ${isLight ? 'text-stone-600 hover:text-stone-900' : 'text-neutral-400 hover:text-white'}`}
            >
              Clear photographer filter (Showing @{selectedPhotographer.username})
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {displayedProjects.length === 0 ? (
        <div className={`flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 text-center ${
          isLight ? 'border-amber-300 bg-amber-50/50 text-stone-900' : 'border-orange-500/20 bg-[#130b08]/40 text-white'
        }`}>
          <FolderOpen className="mb-3 h-8 w-8 text-orange-500" />
          <h3 className="font-sans text-lg font-semibold">No Projects Found</h3>
          <p className={`mt-1 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Create a project or publish collections to start curating your photography portfolio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {displayedProjects.map(project => {
          const author = users.find(u => u.id === project.userId);
          const count = photos.filter(p => p.projectId === project.id).length;

          return (
            <div
              key={project.id}
              onClick={() => setSelectedProject(project)}
              className={`group cursor-pointer rounded-2xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden shadow-sm hover:shadow-lg ${
                isLight
                  ? 'border-amber-200 bg-white hover:border-amber-400'
                  : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
              }`}
            >
              {/* Cover Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
                <img
                  src={project.coverPhotoUrl}
                  alt={project.title}
                  className="h-full w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono-code text-[11px] text-white">
                  <span className="bg-black/80 px-2 py-0.5 border border-orange-500/30 rounded text-[10px] uppercase font-bold text-orange-300">
                    {project.category}
                  </span>
                  <span className="text-[10px] text-orange-200/90 font-medium">
                    {count} Archival Frames
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <h3 className={`font-editorial text-lg font-bold transition-colors ${
                  isLight ? 'text-stone-900 group-hover:text-[#ff6b00]' : 'text-white group-hover:text-orange-200'
                }`}>
                  {project.title}
                </h3>
                <p className={`mt-1.5 line-clamp-2 text-xs leading-relaxed ${
                  isLight ? 'text-stone-600' : 'text-neutral-400'
                }`}>
                  {project.description}
                </p>

                <div className={`mt-4 flex items-center justify-between border-t pt-3 ${
                  isLight ? 'border-amber-100' : 'border-orange-500/15'
                }`}>
                  {author && (
                    <div className="flex items-center gap-2">
                      <img
                        src={author.avatar}
                        alt={`@${author.username}`}
                        className="h-5 w-5 grayscale object-cover rounded-full ring-1 ring-orange-500/40"
                      />
                      <span className={`font-mono-code text-[11px] font-semibold ${
                        isLight ? 'text-stone-700' : 'text-orange-200/90'
                      }`}>
                        @{author.username}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openTransferModalForProject(project);
                    }}
                    title="Send folder to client"
                    className={`flex items-center gap-1 font-mono-code text-[10px] uppercase tracking-wider font-bold transition-colors ${
                      isLight ? 'text-stone-600 hover:text-[#ff6b00]' : 'text-orange-300 hover:text-white'
                    }`}
                  >
                    <Send className="h-3 w-3 text-[#ff6b00]" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
