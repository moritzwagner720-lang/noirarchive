import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { verifyTransferAccess, calculateTotalTransferSize } from '../utils/transfer';
import {
  Download,
  Lock,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  ShieldAlert,
  Star,
  FileArchive,
  Eye,
  Check,
  MessageSquare,
  AlertCircle,
  Copy,
} from 'lucide-react';
import JSZip from 'jszip';

export const TransferPortalView: React.FC<{ transferId: string }> = ({ transferId }) => {
  const {
    transfers,
    setActiveTransferPortalId,
    recordDownload,
    addTransferReview,
    setLightboxPhoto,
    photos,
    theme,
  } = useApp();

  const isLight = theme === 'light';

  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Client Review Form
  const [rating, setRating] = useState(5);
  const [clientAuthor, setClientAuthor] = useState('');
  const [clientComment, setClientComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Zip downloading state
  const [isZipping, setIsZipping] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const pkg = transfers.find(t => t.id === transferId);

  if (!pkg) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-[#ff6b00]" />
        <h2 className={`font-sans text-2xl font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>Transfer Not Found</h2>
        <p className={`mt-2 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
          Transfer package reference "{transferId}" does not exist or has expired.
        </p>
        <button
          onClick={() => setActiveTransferPortalId(null)}
          className="mt-6 rounded-xl bg-[#ff6b00] px-5 py-2.5 font-mono-code text-xs font-bold text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/25"
        >
          Return to Archive
        </button>
      </div>
    );
  }

  // Check access if locked
  const isPasswordProtected = pkg.hasPassword && !unlocked;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    const check = verifyTransferAccess(pkg, passwordInput);
    if (check.canAccess) {
      setUnlocked(true);
    } else {
      setPasswordError(check.error || 'Incorrect password.');
    }
  };

  // Real JSZip client download of the whole folder
  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      recordDownload(pkg.id);

      const zip = new JSZip();
      const folderName = pkg.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const folder = zip.folder(folderName) || zip;

      // Add each file
      for (let i = 0; i < pkg.files.length; i++) {
        const file = pkg.files[i];
        try {
          if (file.url.startsWith('data:')) {
            // Base64 data URL
            const base64Data = file.url.split(',')[1];
            folder.file(file.name, base64Data, { base64: true });
          } else {
            // External URL - fetch as blob
            const res = await fetch(file.url);
            const blob = await res.blob();
            folder.file(file.name, blob);
          }
        } catch {
          // Fallback text entry if CORS blocks remote image fetch
          folder.file(
            file.name.replace(/\.\w+$/, '.txt'),
            `Photo Archive Item: ${file.name}\nSource: ${file.url}\nResolution: Archival`
          );
        }
      }

      // Add a manifest README
      folder.file(
        'ARCHIVE_MANIFEST.txt',
        `NOIR ARCHIVE CLIENT DELIVERY\nPackage ID: ${pkg.id}\nSender: @${pkg.senderUsername}\nTitle: ${pkg.title}\nTotal Files: ${pkg.files.length}\nDelivery Note: ${pkg.note || 'None'}\nDownloaded at: ${new Date().toISOString()}\n`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(content);

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${folderName}_Archival_Bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      console.error('ZIP generation failed', e);
      alert('Failed to pack zip. You can download files individually below.');
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadSingle = (file: (typeof pkg.files)[0]) => {
    recordDownload(pkg.id);
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientComment.trim()) return;

    addTransferReview(pkg.id, {
      author: clientAuthor.trim() || 'Client / Reviewer',
      rating,
      comment: clientComment.trim(),
    });

    setClientComment('');
    setReviewSubmitted(true);
  };

  const totalSize = calculateTotalTransferSize(pkg.files);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Return Button */}
      <button
        onClick={() => setActiveTransferPortalId(null)}
        className={`mb-6 flex items-center gap-1.5 font-mono-code text-xs transition-colors ${
          isLight ? 'text-stone-600 hover:text-stone-900' : 'text-neutral-400 hover:text-white'
        }`}
      >
        <ArrowLeft className="h-3.5 w-3.5 text-[#ff6b00]" />
        <span>Return to Noir Archive</span>
      </button>

      {/* Password Gate if protected */}
      {isPasswordProtected ? (
        <div className={`mx-auto max-w-md rounded-2xl border p-6 sm:p-8 text-center shadow-2xl transition-colors ${
          isLight ? 'bg-white border-amber-300 text-stone-900 shadow-orange-500/10' : 'bg-[#140b07] border-orange-500/30 text-white shadow-2xl shadow-orange-950/60'
        }`}>
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${
            isLight ? 'border-amber-300 bg-amber-50 text-stone-900' : 'border-orange-500/30 bg-[#1c0f0a] text-white'
          }`}>
            <Lock className="h-5 w-5 text-[#ff6b00]" />
          </div>

          <div className="flex items-center justify-center gap-1.5 font-mono-code text-[10px] uppercase tracking-wider text-[#ff6b00] font-bold">
            <span>PROTECTED TRANSFER PORTAL</span>
            <span>•</span>
            <span>{pkg.id}</span>
          </div>

          <h2 className={`mt-1 font-sans text-2xl font-bold tracking-tight ${isLight ? 'text-stone-900' : 'text-white'}`}>
            Access Password Required
          </h2>
          <p className={`mt-2 text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
            Photographer <span className={`font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>@{pkg.senderUsername}</span> has protected this delivery package with an access key.
          </p>

          {passwordError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="mt-5 space-y-3">
            <input
              type="password"
              required
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              aria-label="Transfer password"
              className={`w-full rounded-xl border py-2.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                isLight ? 'bg-amber-50/50 border-amber-300 text-stone-900' : 'bg-[#180e0a] border-orange-500/30 text-white'
              }`}
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] py-3 text-xs font-bold uppercase tracking-wider text-black shadow-lg shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00]"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Unlock Archive</span>
            </button>
          </form>

          <p className={`mt-4 font-mono-code text-[10px] ${isLight ? 'text-stone-500' : 'text-neutral-500'}`}>
            This archive is password-protected by the sender. Enter your delivery password above to access files.
          </p>
        </div>
      ) : (
        /* Unlocked / Public Transfer Package Content */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className={`rounded-2xl border p-6 sm:p-8 transition-colors ${
            isLight ? 'border-amber-200 bg-white/95 text-stone-900 shadow-sm' : 'border-orange-500/20 bg-[#140b07] text-white'
          }`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest text-[#ff6b00] font-bold">
                  <span className="h-2 w-2 rounded-full bg-[#ff6b00]" />
                  <span>CLIENT DELIVERY PORTAL</span>
                  <span>•</span>
                  <span>REF #{pkg.id}</span>
                </div>
                <h1 className={`mt-2 font-sans text-2xl font-bold tracking-tight sm:text-3xl ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  {pkg.title}
                </h1>
                <div className={`mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs ${
                  isLight ? 'text-stone-600' : 'text-neutral-400'
                }`}>
                  <span>
                    Curated by <strong className={`font-semibold ${isLight ? 'text-stone-900' : 'text-white'}`}>@{pkg.senderUsername}</strong>
                  </span>
                  <span>•</span>
                  <span>{pkg.files.length} Archival Files</span>
                  <span>•</span>
                  <span>{totalSize} Total</span>
                  {pkg.expiresAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-500 font-semibold">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(pkg.expiresAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>

                {pkg.note && (
                  <div className={`mt-4 border-l-2 border-[#ff6b00] rounded-r-xl p-3 font-sans text-xs italic ${
                    isLight ? 'bg-amber-50 text-stone-700' : 'bg-[#1b0e08] text-neutral-300'
                  }`}>
                    "{pkg.note}"
                  </div>
                )}
              </div>

              {/* Download All as ZIP Action */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-6 py-3 text-xs font-bold tracking-wider uppercase text-black shadow-lg shadow-[#ff6b00]/25 transition-all hover:bg-[#e05e00] disabled:opacity-50"
                >
                  <FileArchive className="h-4 w-4" />
                  <span>{isZipping ? 'Archiving ZIP...' : `Download Folder (.ZIP)`}</span>
                </button>

                <div className={`flex items-center justify-between font-mono-code text-[10px] px-1 ${
                  isLight ? 'text-stone-500' : 'text-neutral-400'
                }`}>
                  <span>Downloaded {pkg.downloadsCount} times</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready for proofing</span>
                </div>
              </div>
            </div>
          </div>

          {/* File Grid */}
          <div>
            <div className={`mb-4 flex items-center justify-between border-b pb-3 font-mono-code text-xs ${
              isLight ? 'border-amber-200 text-stone-600' : 'border-orange-500/20 text-neutral-400'
            }`}>
              <span className="uppercase tracking-wider font-semibold">
                Delivered Folder Contents ({pkg.files.length} Assets)
              </span>
              <span>Click image to inspect or download individually</span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pkg.files.map((file) => {
                const matchedPhoto = photos.find(p => p.url === file.url);
                return (
                  <div
                    key={file.id}
                    className={`group rounded-xl border overflow-hidden transition-all duration-300 ${
                      isLight
                        ? 'border-amber-200 bg-white hover:border-amber-400 shadow-sm'
                        : 'border-orange-500/20 bg-[#140b07] hover:border-orange-500/40'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => matchedPhoto && setLightboxPhoto(matchedPhoto)}
                      className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-neutral-900"
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="flex items-center gap-1.5 font-mono-code text-xs text-white">
                          <Eye className="h-4 w-4" /> Inspect Image
                        </span>
                      </div>
                    </div>

                    {/* File Meta */}
                    <div className="p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-mono-code text-xs font-semibold truncate ${
                          isLight ? 'text-stone-900' : 'text-white'
                        }`}>
                          {file.name}
                        </p>
                        <span className={`font-mono-code text-[10px] shrink-0 ${
                          isLight ? 'text-stone-500' : 'text-neutral-400'
                        }`}>
                          {file.size}
                        </span>
                      </div>

                      <div className={`mt-3 flex items-center justify-between border-t pt-2.5 ${
                        isLight ? 'border-amber-100' : 'border-orange-500/20'
                      }`}>
                        <span className={`font-mono-code text-[10px] ${
                          isLight ? 'text-stone-500' : 'text-neutral-400'
                        }`}>
                          {file.folderPath || 'Master_Selection'}
                        </span>

                        <button
                          onClick={() => handleDownloadSingle(file)}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 font-mono-code text-[11px] transition-colors ${
                            isLight
                              ? 'border-amber-300 bg-amber-50 text-stone-800 hover:bg-amber-100 hover:border-amber-400'
                              : 'border-orange-500/30 bg-[#1c0f0a] text-neutral-200 hover:border-[#ff6b00] hover:text-[#ff6b00]'
                          }`}
                        >
                          <Download className="h-3 w-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Client Feedback / Approval Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Submit Feedback */}
            <div className={`rounded-2xl border p-6 transition-colors ${
              isLight ? 'border-amber-200 bg-white/95 text-stone-900 shadow-sm' : 'border-orange-500/20 bg-[#140b07] text-white'
            }`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#ff6b00]" />
                <h3 className={`font-sans text-lg font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                  Client Approval & Feedback
                </h3>
              </div>
              <p className={`mt-1 font-sans text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                Leave rating and feedback for sender @{pkg.senderUsername}.
              </p>

              {reviewSubmitted && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-300">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span>Review recorded successfully!</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
                {/* Rating Stars */}
                <div>
                  <label className={`block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                    isLight ? 'text-stone-600' : 'text-neutral-400'
                  }`}>
                    Approval Rating:
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            star <= rating ? 'fill-[#ff6b00] text-[#ff6b00]' : 'text-stone-300 dark:text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className={`ml-2 font-mono-code text-xs ${isLight ? 'text-stone-600' : 'text-neutral-400'}`}>
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className={`block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                    isLight ? 'text-stone-600' : 'text-neutral-400'
                  }`}>
                    Your Name / Publication:
                  </label>
                  <input
                    type="text"
                    value={clientAuthor}
                    onChange={e => setClientAuthor(e.target.value)}
                    aria-label="Your Name or Publication"
                    className={`w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-amber-50/50 border-amber-300 text-stone-900' : 'bg-[#180e0a] border-orange-500/30 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 ${
                    isLight ? 'text-stone-600' : 'text-neutral-400'
                  }`}>
                    Selection Notes / Approval:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={clientComment}
                    onChange={e => setClientComment(e.target.value)}
                    aria-label="Selection Notes or Approval"
                    className={`w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs focus:border-[#ff6b00] focus:outline-none transition-colors ${
                      isLight ? 'bg-amber-50/50 border-amber-300 text-stone-900' : 'bg-[#180e0a] border-orange-500/30 text-white'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#ff6b00] px-4 py-2 text-xs font-bold uppercase text-black hover:bg-[#e05e00] shadow-md shadow-[#ff6b00]/25 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Submit Approval</span>
                </button>
              </form>
            </div>

            {/* Existing Feedback History */}
            <div className={`rounded-2xl border p-6 transition-colors ${
              isLight ? 'border-amber-200 bg-white/95 text-stone-900 shadow-sm' : 'border-orange-500/20 bg-[#140b07] text-white'
            }`}>
              <h3 className={`font-sans text-lg font-bold mb-2 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                Approval Log ({pkg.reviews?.length || 0})
              </h3>
              {(!pkg.reviews || pkg.reviews.length === 0) ? (
                <p className={`font-mono-code text-xs ${isLight ? 'text-stone-500' : 'text-neutral-400'}`}>
                  No client reviews submitted yet. Use the form on the left to submit an approval stamp.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {pkg.reviews.map(rev => (
                    <div key={rev.id} className={`rounded-xl border p-3 ${
                      isLight ? 'border-amber-200 bg-amber-50/60' : 'border-orange-500/20 bg-[#1a0e0a]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`font-sans text-xs font-bold ${isLight ? 'text-stone-900' : 'text-white'}`}>
                          {rev.author}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-[#ff6b00] text-[#ff6b00]" />
                          ))}
                        </div>
                      </div>
                      <p className={`mt-1 font-sans text-xs italic ${isLight ? 'text-stone-700' : 'text-neutral-300'}`}>
                        "{rev.comment}"
                      </p>
                      <span className={`mt-2 block font-mono-code text-[9px] ${isLight ? 'text-stone-500' : 'text-neutral-500'}`}>
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
