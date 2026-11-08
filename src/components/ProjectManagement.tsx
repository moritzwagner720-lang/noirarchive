import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Project, Photo, PhotoCategory, GridLayout } from '../types';
import {
  FolderPlus,
  Plus,
  Send,
  Trash2,
  Camera,
  Image as ImageIcon,
  Edit2,
  Check,
  Upload,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
} from 'lucide-react';

export const ProjectManagement: React.FC = () => {
  const {
    currentUser,
    projects,
    photos,
    createProject,
    updateProject,
    deleteProject,
    addPhoto,
    deletePhoto,
    setLightboxPhoto,
    openTransferModalForProject,
    setSelectedProject,
    setActiveTab,
    setAuthModal,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  // Create Project Modal / Drawer
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<PhotoCategory>('architecture');
  const [newLayout, setNewLayout] = useState<GridLayout>('grid-3');
  const [newClientName, setNewClientName] = useState('');
  const [newDeliveryNotes, setNewDeliveryNotes] = useState('');

  // Active Project for adding photos
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Add Photo Drawer / Form
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoAspect, setPhotoAspect] = useState<Photo['aspectRatio']>('landscape');
  const [camera, setCamera] = useState('Leica M10 Monochrom');
  const [lens, setLens] = useState('Summilux-M 35mm f/1.4 ASPH');
  const [focalLength, setFocalLength] = useState('35mm');
  const [aperture, setAperture] = useState('f/2.8');
  const [shutterSpeed, setShutterSpeed] = useState('1/500s');
  const [iso, setIso] = useState('160');
  const [location, setLocation] = useState('Berlin, Germany');

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <Camera className="mx-auto mb-4 h-12 w-12 text-[#ff6b00]" />
        <h2 className={`font-sans text-2xl font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
          Studio Authentication Required
        </h2>
        <p className={`mt-2 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
          Join or log in to access personalized darkroom project curation and client folder deliveries.
        </p>
        <button
          onClick={() => setAuthModal('signin')}
          className="mt-6 rounded-xl bg-[#ff6b00] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/20"
        >
          Sign In
        </button>
      </div>
    );
  }

  const userProjects = projects.filter(p => p.userId === currentUser.id);
  const userPhotos = photos.filter(p => p.userId === currentUser.id);

  // Select first project by default if none selected
  const activeProject =
    userProjects.find(p => p.id === activeProjectId) || userProjects[0] || null;

  const currentProjectPhotos = activeProject
    ? photos.filter(p => p.projectId === activeProject.id)
    : [];

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const proj = createProject({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      layoutPreference: newLayout,
      clientName: newClientName,
      clientDeliveryNotes: newDeliveryNotes,
      coverPhotoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=85',
    });

    setNewTitle('');
    setNewDesc('');
    setNewClientName('');
    setNewDeliveryNotes('');
    setIsCreatingProject(false);
    setActiveProjectId(proj.id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      if (!photoTitle) {
        setPhotoTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !photoUrl.trim()) return;

    addPhoto({
      projectId: activeProject.id,
      title: photoTitle.trim() || 'Untitled Negative',
      caption: photoCaption.trim() || 'Archival monochrome study.',
      url: photoUrl,
      aspectRatio: photoAspect,
      category: activeProject.category,
      fileSize: '16.8 MB',
      dimensions: '6000 x 4000',
      exif: {
        camera,
        lens,
        focalLength,
        aperture,
        shutterSpeed,
        iso,
        year: '2024',
        location,
      },
    });

    // Reset photo form
    setPhotoTitle('');
    setPhotoCaption('');
    setPhotoUrl('');
    setIsAddingPhoto(false);
  };

  // Quick preset loader so user can immediately populate high-quality sample work
  const loadPresetPhoto = (sampleUrl: string, sampleTitle: string, sampleCamera: string) => {
    setPhotoUrl(sampleUrl);
    setPhotoTitle(sampleTitle);
    setCamera(sampleCamera);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Studio Header & Stats */}
      <div className={`mb-8 border-b pb-6 transition-colors ${isLight ? 'border-amber-200' : 'border-orange-500/20'}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar}
              alt={`@${currentUser.username}`}
              className={`h-16 w-16 grayscale object-cover rounded-xl ring-1 ${isLight ? 'ring-amber-300' : 'ring-orange-500/30'}`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
                  PERSONAL PROJECT STUDIO
                </span>
              </div>
              <h1 className={`font-sans text-2xl font-bold tracking-tight sm:text-3xl ${isLight ? 'text-stone-900' : 'text-white'}`}>
                @{currentUser.username}
              </h1>
              <p className={`mt-1 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                {currentUser.location || 'Global'} • {currentUser.bio || 'Curating photography projects and archival folders.'}
              </p>
            </div>
          </div>

          {/* Actions: New Project */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatingProject(true)}
              className="flex items-center gap-2 rounded-xl bg-[#ff6b00] px-4 py-2.5 text-xs font-bold tracking-wider uppercase text-black shadow-md shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00]"
            >
              <FolderPlus className="h-4 w-4" />
              <span>Create Project / Album</span>
            </button>
          </div>
        </div>

        {/* Quick Studio Stats */}
        <div className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono-code text-xs rounded-xl border p-4 transition-colors ${
          isLight ? 'border-amber-200 bg-white/90 shadow-sm' : 'border-orange-500/20 bg-[#140b07]'
        }`}>
          <div>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Personal Projects</span>
            <span className={`text-lg font-extrabold ${isLight ? 'text-stone-900' : 'text-white'}`}>{userProjects.length}</span>
          </div>
          <div>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Cataloged Negatives</span>
            <span className={`text-lg font-extrabold ${isLight ? 'text-stone-900' : 'text-white'}`}>{userPhotos.length}</span>
          </div>
          <div>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Primary Darkroom Focus</span>
            <span className={`text-sm font-semibold capitalize ${isLight ? 'text-amber-800' : 'text-orange-300'}`}>
              {userProjects[0]?.category || 'Monochrome'}
            </span>
          </div>
          <div>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Security Status</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Unique Claim Verified</span>
          </div>
        </div>
      </div>

      {/* Main Studio Work Area */}
      {userProjects.length === 0 ? (
        <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          isLight ? 'border-amber-300 bg-amber-50/50' : 'border-orange-500/20 bg-[#140b07]/60'
        }`}>
          <FolderPlus className="mx-auto mb-3 h-10 w-10 text-[#ff6b00]" />
          <h3 className={`font-sans text-lg font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>No Projects in Studio Yet</h3>
          <p className={`mt-1 font-mono-code text-xs max-w-md mx-auto ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Create your first photography portfolio folder to begin curating black and white works, customizing grid layouts, and delivering archival files to clients.
          </p>
          <button
            onClick={() => setIsCreatingProject(true)}
            className="mt-5 rounded-xl bg-[#ff6b00] px-5 py-2.5 font-mono-code text-xs font-bold uppercase text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/20"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Left Column: Projects List */}
          <div className="lg:col-span-1 space-y-3">
            <div className={`flex items-center justify-between border-b pb-2 ${
              isLight ? 'border-amber-200 text-stone-600' : 'border-orange-500/20 text-neutral-400'
            }`}>
              <span className="font-mono-code text-[11px] uppercase tracking-wider font-semibold">
                Your Folders & Albums
              </span>
              <button
                onClick={() => setIsCreatingProject(true)}
                className={`transition-colors ${isLight ? 'text-stone-600 hover:text-stone-900' : 'text-neutral-400 hover:text-[#ff6b00]'}`}
                title="Create Project"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {userProjects.map(proj => {
                const count = photos.filter(p => p.projectId === proj.id).length;
                const isSelected = activeProject?.id === proj.id;

                return (
                  <div
                    key={proj.id}
                    onClick={() => setActiveProjectId(proj.id)}
                    className={`group flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isLight
                          ? 'border-amber-500 bg-amber-100/80 text-stone-950 shadow-sm'
                          : 'border-[#ff6b00] bg-[#22120a] text-white shadow-md shadow-[#ff6b00]/10'
                        : isLight
                        ? 'border-amber-200/80 bg-white text-stone-700 hover:border-amber-400 hover:bg-amber-50/60'
                        : 'border-orange-500/20 bg-[#140b07] text-neutral-400 hover:border-orange-500/40 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={proj.coverPhotoUrl}
                        alt={proj.title}
                        className={`h-10 w-10 shrink-0 rounded-lg grayscale object-cover ring-1 ${
                          isLight ? 'ring-amber-200' : 'ring-orange-500/30'
                        }`}
                      />
                      <div className="truncate">
                        <p className={`font-sans text-xs font-bold truncate ${isLight ? 'text-stone-900' : 'text-white'}`}>
                          {proj.title}
                        </p>
                        <p className={`font-mono-code text-[10px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                          {count} photos • {proj.category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${
                      isSelected ? 'text-[#ff6b00]' : isLight ? 'text-stone-400 group-hover:text-stone-900' : 'text-neutral-600 group-hover:text-white'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Project Details & Photo Grid */}
          <div className="lg:col-span-3">
            {activeProject && (
              <div className={`rounded-2xl border p-6 transition-colors ${
                isLight ? 'border-amber-200 bg-white/95 text-stone-900 shadow-sm' : 'border-orange-500/20 bg-[#140b07] text-white'
              }`}>
                {/* Active Project Header Bar */}
                <div className={`flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between ${
                  isLight ? 'border-amber-200' : 'border-orange-500/20'
                }`}>
                  <div>
                    <div className="flex items-center gap-2 font-mono-code text-[10px] text-[#ff6b00] font-bold uppercase tracking-widest">
                      <span>PROJECT FOLDER</span>
                      <span>•</span>
                      <span>{activeProject.category}</span>
                      <span>•</span>
                      <span>Layout: {activeProject.layoutPreference}</span>
                    </div>

                    <h2 className={`mt-1 font-sans text-2xl font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
                      {activeProject.title}
                    </h2>
                    <p className={`mt-1 text-xs max-w-2xl ${isLight ? 'text-stone-600' : 'text-neutral-300'}`}>
                      {activeProject.description}
                    </p>

                    {activeProject.clientName && (
                      <div className={`mt-3 font-mono-code text-[11px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                        Commissioned by: <span className={`font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>{activeProject.clientName}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions for this project */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => openTransferModalForProject(activeProject)}
                      className="flex items-center gap-1.5 rounded-xl bg-[#ff6b00] px-4 py-2 font-mono-code text-xs font-bold text-black shadow-md shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00]"
                      title="Send this folder to client or peer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Folder</span>
                    </button>

                    <button
                      onClick={() => setIsAddingPhoto(true)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 font-mono-code text-xs font-semibold transition-colors ${
                        isLight
                          ? 'border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100'
                          : 'border-orange-500/30 bg-[#1c100a] text-orange-200 hover:border-[#ff6b00]'
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Photograph</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${activeProject.title}"?`)) {
                          deleteProject(activeProject.id);
                        }
                      }}
                      className={`p-2 rounded-xl border transition-colors ${
                        isLight
                          ? 'border-amber-200 bg-white text-stone-400 hover:border-red-400 hover:text-red-600'
                          : 'border-orange-500/20 bg-[#1c100a] text-neutral-400 hover:border-red-500/50 hover:text-red-400'
                      }`}
                      title="Delete project"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Photos Inside This Project */}
                <div className="mt-6">
                  <div className={`mb-4 flex items-center justify-between font-mono-code text-xs ${
                    isLight ? 'text-stone-500' : 'text-neutral-400'
                  }`}>
                    <span className="uppercase tracking-wider font-semibold">
                      Archival Works in Folder ({currentProjectPhotos.length})
                    </span>
                    <span>Click negative to view EXIF or manage</span>
                  </div>

                  {currentProjectPhotos.length === 0 ? (
                    <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      isLight ? 'border-amber-200 bg-amber-50/40' : 'border-orange-500/20 bg-[#180e0a]/50'
                    }`}>
                      <Camera className="mx-auto mb-2 h-7 w-7 text-[#ff6b00]" />
                      <p className={`font-sans text-sm font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>This album is empty</p>
                      <p className={`mt-1 font-mono-code text-[11px] ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                        Upload raw files or load Leica monochrome samples.
                      </p>
                      <button
                        onClick={() => setIsAddingPhoto(true)}
                        className="mt-3 rounded-xl bg-[#ff6b00] px-4 py-2 font-mono-code text-xs font-bold text-black hover:bg-[#e05e00]"
                      >
                        Add Photo to Album
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {currentProjectPhotos.map(photo => (
                        <div
                          key={photo.id}
                          className={`group relative rounded-xl border overflow-hidden transition-all duration-300 ${
                            isLight
                              ? 'border-amber-200 bg-amber-50/40 hover:border-amber-400 shadow-sm'
                              : 'border-orange-500/20 bg-[#180e0a] hover:border-orange-500/40'
                          }`}
                        >
                          <div
                            onClick={() => setLightboxPhoto(photo)}
                            className="aspect-[4/3] w-full cursor-pointer overflow-hidden bg-black"
                          >
                            <img
                              src={photo.url}
                              alt={photo.title}
                              className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>

                          <div className="p-3">
                            <div className="flex items-start justify-between">
                              <h4 className={`font-sans text-xs font-bold truncate max-w-[160px] ${
                                isLight ? 'text-stone-900' : 'text-white'
                              }`}>
                                {photo.title}
                              </h4>
                              <button
                                onClick={() => deletePhoto(photo.id)}
                                className={`transition-colors ${isLight ? 'text-stone-400 hover:text-red-600' : 'text-neutral-500 hover:text-red-400'}`}
                                title="Remove photo"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            <div className={`mt-2 flex items-center justify-between font-mono-code text-[10px] border-t pt-2 ${
                              isLight ? 'border-amber-200/60 text-stone-500' : 'border-orange-500/20 text-neutral-400'
                            }`}>
                              <span>{photo.exif.camera || 'Analog'}</span>
                              <span>{photo.exif.aperture}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className={`relative w-full max-w-lg rounded-2xl border p-6 sm:p-8 shadow-2xl transition-colors ${
            isLight
              ? 'bg-amber-50/95 border-amber-300 text-stone-900 shadow-orange-500/10'
              : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
          }`}>
            <button
              onClick={() => setIsCreatingProject(false)}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                isLight
                  ? 'border-amber-300 text-stone-500 hover:bg-amber-100 hover:text-stone-900'
                  : 'border-orange-500/30 text-neutral-400 hover:bg-[#20110a] hover:text-[#ff6b00]'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5">
              <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
                🎃 STUDIO CURATION
              </span>
              <h2 className="font-sans text-xl font-bold tracking-tight mt-1">
                New Portfolio Project / Album
              </h2>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                  Project Title <span className="text-[#ff6b00]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  aria-label="Project Title"
                  className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                    isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                  Curatorial Description
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  aria-label="Curatorial Description"
                  className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                    isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Category Focus
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as PhotoCategory)}
                    className={`mt-1 w-full rounded-xl border py-2 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  >
                    <option value="architecture">Architecture</option>
                    <option value="portraiture">Portraiture</option>
                    <option value="street">Street</option>
                    <option value="nature">Nature</option>
                    <option value="still-life">Still Life</option>
                    <option value="editorial">Editorial</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Preferred Grid
                  </label>
                  <select
                    value={newLayout}
                    onChange={e => setNewLayout(e.target.value as GridLayout)}
                    className={`mt-1 w-full rounded-xl border py-2 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  >
                    <option value="grid-2">2-Col Editorial</option>
                    <option value="grid-3">3-Col Classic</option>
                    <option value="masonry">Masonry Flow</option>
                    <option value="contact-sheet">Analog Contact Sheet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Client / Commission
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    aria-label="Client / Commission"
                    className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Delivery Note
                  </label>
                  <input
                    type="text"
                    value={newDeliveryNotes}
                    onChange={e => setNewDeliveryNotes(e.target.value)}
                    aria-label="Delivery Note"
                    className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00]"
              >
                <FolderPlus className="h-4 w-4" />
                <span>Initialize Project</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {isAddingPhoto && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 sm:p-8 shadow-2xl transition-colors ${
            isLight
              ? 'bg-amber-50/95 border-amber-300 text-stone-900 shadow-orange-500/10'
              : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
          }`}>
            <button
              onClick={() => setIsAddingPhoto(false)}
              className={`absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${
                isLight
                  ? 'border-amber-300 text-stone-500 hover:bg-amber-100 hover:text-stone-900'
                  : 'border-orange-500/30 text-neutral-400 hover:bg-[#20110a] hover:text-[#ff6b00]'
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5">
              <span className="font-mono-code text-[10px] tracking-widest text-[#ff6b00] font-bold uppercase">
                🎃 ARCHIVAL UPLOAD • {activeProject.title}
              </span>
              <h2 className="font-sans text-xl font-bold tracking-tight mt-1">
                Add Photograph to Album
              </h2>
            </div>

            {/* Quick Sample Presets */}
            <div className={`mb-4 rounded-xl border p-3 ${
              isLight ? 'border-amber-200 bg-amber-100/60' : 'border-orange-500/20 bg-[#1a0e0a]'
            }`}>
              <span className={`font-mono-code text-[10px] uppercase tracking-wider font-semibold block mb-2 ${
                isLight ? 'text-stone-600' : 'text-neutral-400'
              }`}>
                Quick Sample Presets (Click to load authentic monochrome artwork):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    loadPresetPhoto(
                      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1400&q=85',
                      'Concrete Horizon & Void',
                      'Leica M10 Monochrom'
                    )
                  }
                  className={`rounded-lg border px-2.5 py-1 font-mono-code text-[10px] transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-50'
                      : 'border-orange-500/30 bg-[#22130c] text-orange-200 hover:border-[#ff6b00]'
                  }`}
                >
                  Preset 1: Brutalist Concrete
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadPresetPhoto(
                      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1400&q=85',
                      'Chiaroscuro Silhouette',
                      'Hasselblad H6D-100c'
                    )
                  }
                  className={`rounded-lg border px-2.5 py-1 font-mono-code text-[10px] transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-50'
                      : 'border-orange-500/30 bg-[#22130c] text-orange-200 hover:border-[#ff6b00]'
                  }`}
                >
                  Preset 2: Studio Portrait
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadPresetPhoto(
                      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1400&q=85',
                      'Rain Reflections Nocturne',
                      'Fujifilm X-Pro3'
                    )
                  }
                  className={`rounded-lg border px-2.5 py-1 font-mono-code text-[10px] transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-white text-stone-800 hover:bg-amber-50'
                      : 'border-orange-500/30 bg-[#22130c] text-orange-200 hover:border-[#ff6b00]'
                  }`}
                >
                  Preset 3: Midnight Rain
                </button>
              </div>
            </div>

            <form onSubmit={handleAddPhotoSubmit} className="space-y-4">
              {/* Image Input Options */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold mb-1 ${
                    isLight ? 'text-stone-700' : 'text-neutral-300'
                  }`}>
                    Upload from Machine
                  </label>
                  <label className={`flex items-center justify-center border-2 border-dashed rounded-xl py-3 px-4 text-center cursor-pointer transition-colors ${
                    isLight
                      ? 'border-amber-300 bg-white hover:border-amber-500'
                      : 'border-orange-500/40 bg-[#180e0a] hover:border-[#ff6b00]'
                  }`}>
                    <Upload className="h-4 w-4 text-[#ff6b00] mr-2" />
                    <span className={`font-mono-code text-xs ${isLight ? 'text-stone-800' : 'text-neutral-300'}`}>Choose File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold mb-1 ${
                    isLight ? 'text-stone-700' : 'text-neutral-300'
                  }`}>
                    Or Image URL / Base64
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    aria-label="Image URL or Base64"
                    className={`w-full rounded-xl border py-2.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-amber-300 text-stone-900'
                        : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>
              </div>

              {photoUrl && (
                <div className={`aspect-[16/9] w-full max-h-40 overflow-hidden rounded-xl border flex items-center justify-center bg-black ${
                  isLight ? 'border-amber-200' : 'border-orange-500/30'
                }`}>
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="h-full w-full object-contain grayscale"
                  />
                </div>
              )}

              {/* Title & Caption */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Photo Title <span className="text-[#ff6b00]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={photoTitle}
                    onChange={e => setPhotoTitle(e.target.value)}
                    aria-label="Photo Title"
                    className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                    Aspect Ratio
                  </label>
                  <select
                    value={photoAspect}
                    onChange={e => setPhotoAspect(e.target.value as Photo['aspectRatio'])}
                    className={`mt-1 w-full rounded-xl border py-2 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                    }`}
                  >
                    <option value="landscape">Landscape (3:2 / 4:3)</option>
                    <option value="portrait">Portrait (4:5 / 3:4)</option>
                    <option value="square">Square (1:1)</option>
                    <option value="panoramic">Panoramic (16:9)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block font-mono-code text-[11px] uppercase font-semibold ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                  Caption / Darkroom Notes
                </label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  aria-label="Caption and Darkroom Notes"
                  className={`mt-1 w-full rounded-xl border py-2 px-3 text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                    isLight ? 'bg-white border-amber-300 text-stone-900' : 'bg-[#1b0e08] border-orange-500/30 text-white'
                  }`}
                />
              </div>

              {/* EXIF Details */}
              <div className={`rounded-xl border p-3 ${
                isLight ? 'border-amber-200 bg-amber-100/50' : 'border-orange-500/20 bg-[#180e0a]'
              }`}>
                <span className={`font-mono-code text-[10px] uppercase tracking-wider font-semibold block mb-2 ${
                  isLight ? 'text-stone-600' : 'text-neutral-400'
                }`}>
                  Optical & Camera EXIF:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono-code text-xs">
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Camera</label>
                    <input
                      type="text"
                      value={camera}
                      onChange={e => setCamera(e.target.value)}
                      className={`mt-0.5 w-full rounded-lg border p-1.5 text-[11px] focus:outline-none ${
                        isLight ? 'border-amber-200 bg-white text-stone-900' : 'border-orange-500/20 bg-[#120a06] text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Optics</label>
                    <input
                      type="text"
                      value={lens}
                      onChange={e => setLens(e.target.value)}
                      className={`mt-0.5 w-full rounded-lg border p-1.5 text-[11px] focus:outline-none ${
                        isLight ? 'border-amber-200 bg-white text-stone-900' : 'border-orange-500/20 bg-[#120a06] text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>Aperture</label>
                    <input
                      type="text"
                      value={aperture}
                      onChange={e => setAperture(e.target.value)}
                      className={`mt-0.5 w-full rounded-lg border p-1.5 text-[11px] focus:outline-none ${
                        isLight ? 'border-amber-200 bg-white text-stone-900' : 'border-orange-500/20 bg-[#120a06] text-white'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[9px] uppercase font-bold block ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>ISO</label>
                    <input
                      type="text"
                      value={iso}
                      onChange={e => setIso(e.target.value)}
                      className={`mt-0.5 w-full rounded-lg border p-1.5 text-[11px] focus:outline-none ${
                        isLight ? 'border-amber-200 bg-white text-stone-900' : 'border-orange-500/20 bg-[#120a06] text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!photoUrl}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
                <span>Save to Darkroom Album</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
