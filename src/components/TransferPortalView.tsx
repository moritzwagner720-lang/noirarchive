import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { verifyTransferAccess, calculateTotalTransferSize } from '../utils/transfer';
import { UserAvatar } from './UserAvatar';
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
  FileText,
  Folder,
  FileImage,
  FileVideo,
} from 'lucide-react';
import JSZip from 'jszip';

export const TransferPortalView: React.FC<{ transferId: string }> = ({ transferId }) => {
  const {
    transfers,
    setActiveTransferPortalId,
    recordDownload,
    addTransferReview,
    setActivePreviewMedia,
  } = useApp();

  const [passwordInput, setPasswordInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Review Form
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
        <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-rose-500" />
        <h2 className="font-sans text-2xl font-bold tracking-tight text-white">Transfer Not Found</h2>
        <p className="mt-2 font-mono-code text-xs text-neutral-400">
          Transfer package reference "{transferId}" does not exist or has expired.
        </p>
        <button
          onClick={() => setActiveTransferPortalId(null)}
          className="mt-6 rounded-xl px-5 py-2.5 font-mono-code text-xs font-bold text-white shadow-md hover:brightness-110"
          style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
        >
          Return to Noir Archive
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

      // Add each file preserving folder structure
      for (let i = 0; i < pkg.files.length; i++) {
        const file = pkg.files[i];
        const relativeFilePath = file.relativePath || file.name;
        try {
          if (file.url.startsWith('data:')) {
            const base64Data = file.url.split(',')[1];
            folder.file(relativeFilePath, base64Data, { base64: true });
          } else {
            const res = await fetch(file.url);
            const blob = await res.blob();
            folder.file(relativeFilePath, blob);
          }
        } catch {
          folder.file(
            relativeFilePath.replace(/\.\w+$/, '.txt'),
            `Archive Item: ${file.name}\nPath: ${relativeFilePath}\nSource: ${file.url}`
          );
        }
      }

      // Add a manifest README
      folder.file(
        'ARCHIVE_MANIFEST.txt',
        `NOIR ARCHIVE DELIVERY\nPackage ID: ${pkg.id}\nSender: @${pkg.senderUsername}\nTitle: ${pkg.title}\nTotal Files: ${pkg.files.length}\nDelivery Note: ${pkg.note || 'None'}\nDownloaded at: ${new Date().toISOString()}\n`
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
      author: clientAuthor.trim() || 'Recipient',
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
        className="mb-6 flex items-center gap-1.5 font-mono-code text-xs text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Noir Archive</span>
      </button>

      {/* Password Gate if protected */}
      {isPasswordProtected ? (
        <div className="mx-auto max-w-md rounded-2xl border p-6 sm:p-8 text-center shadow-2xl bg-[#2b2d31] border-[#383a40] text-white">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#383a40] bg-[#232428] text-white">
            <Lock className="h-5 w-5" style={{ color: 'var(--color-accent, #5865f2)' }} />
          </div>

          <div className="flex items-center justify-center gap-1.5 font-mono-code text-[10px] uppercase tracking-wider font-bold text-neutral-400">
            <span>PROTECTED TRANSFER PORTAL</span>
            <span>•</span>
            <span>{pkg.id}</span>
          </div>

          <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-white">
            Access Password Required
          </h2>
          <p className="mt-2 text-xs text-neutral-400">
            Sender <span className="font-semibold text-white">@{pkg.senderUsername}</span> has protected this transfer package with an access password.
          </p>

          {passwordError && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-400">
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
              placeholder="Enter delivery password..."
              className="w-full rounded-xl border py-2.5 px-3 font-mono-code text-xs bg-[#232428] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
            />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:brightness-110"
              style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Unlock Transfer</span>
            </button>
          </form>

          <p className="mt-4 font-mono-code text-[10px] text-neutral-500">
            This archive is password-protected by the sender. Enter the password to access files.
          </p>
        </div>
      ) : (
        /* Unlocked / Public Transfer Package Content */
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="rounded-2xl border p-6 sm:p-8 border-[#383a40] bg-[#2b2d31] text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono-code text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                  />
                  <span>TRANSFER DOWNLOAD PORTAL</span>
                  <span>•</span>
                  <span>REF #{pkg.id}</span>
                </div>
                <h1 className="mt-2 font-sans text-2xl font-bold tracking-tight sm:text-3xl text-white">
                  {pkg.title}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 font-mono-code text-xs text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <UserAvatar username={pkg.senderUsername} size="xs" />
                    <span>Sent by <strong className="text-white">@{pkg.senderUsername}</strong></span>
                  </span>
                  <span>•</span>
                  <span>{pkg.files.length} Files</span>
                  <span>•</span>
                  <span>{totalSize} Total</span>
                  {pkg.expiresAt && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(pkg.expiresAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>

                {pkg.note && (
                  <div className="mt-4 border-l-2 rounded-r-xl p-3 font-sans text-xs italic bg-[#232428] text-neutral-300 border-[var(--color-accent,#5865f2)]">
                    "{pkg.note}"
                  </div>
                )}
              </div>

              {/* Download All as ZIP Action */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-xs font-bold tracking-wider uppercase text-white shadow-lg hover:brightness-110 disabled:opacity-50 transition-all"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  <FileArchive className="h-4 w-4" />
                  <span>{isZipping ? 'Archiving ZIP...' : `Download Folder (.ZIP)`}</span>
                </button>

                <div className="flex items-center justify-between font-mono-code text-[10px] px-1 text-neutral-400">
                  <span>Downloaded {pkg.downloadsCount} times</span>
                  <span className="text-emerald-400 font-semibold">Ready for download</span>
                </div>
              </div>
            </div>
          </div>

          {/* File Grid */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b pb-3 font-mono-code text-xs border-[#383a40] text-neutral-400">
              <span className="uppercase tracking-wider font-semibold">
                Folder Contents ({pkg.files.length} Assets)
              </span>
              <span>Direct download available for every file</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pkg.files.map(file => {
                const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg)$/i.test(file.name);
                const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name);

                return (
                  <div
                    key={file.id}
                    className="rounded-2xl border p-4 transition-all duration-200 border-[#383a40] bg-[#2b2d31] hover:border-[#4e5058] flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#232428] border border-[#383a40] flex items-center justify-center shrink-0 text-neutral-300">
                        {isImage ? (
                          <FileImage className="h-5 w-5 text-indigo-400" />
                        ) : isVideo ? (
                          <FileVideo className="h-5 w-5 text-amber-400" />
                        ) : (
                          <FileText className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono-code text-xs font-semibold truncate text-white">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-mono-code text-neutral-400 mt-0.5">
                          {file.size}
                        </p>
                        {file.folderPath && (
                          <p className="text-[10px] font-mono-code text-neutral-500 truncate mt-0.5">
                            {file.folderPath}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#383a40] flex items-center justify-end gap-2">
                      {(isImage || isVideo) && (
                        <button
                          type="button"
                          onClick={() => setActivePreviewMedia({
                            url: file.url,
                            title: file.name,
                            type: isVideo ? 'video' : 'image',
                          })}
                          className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-code text-xs border-[#383a40] bg-[#313338] text-neutral-200 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="h-3 w-3 text-indigo-400" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDownloadSingle(file)}
                        className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-code text-xs border-[#383a40] bg-[#232428] text-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Safety Notice in Portal */}
            <div className="mt-6 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 leading-relaxed font-mono-code">
              <strong className="text-amber-300">Safety Notice:</strong> Uploaded files are not automatically scanned for viruses or malicious code. Always verify the sender's identity (@{pkg.senderUsername}) before downloading or executing files.
            </div>
          </div>

          {/* Feedback & Confirmation */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Submit Feedback */}
            <div className="rounded-2xl border p-6 border-[#383a40] bg-[#2b2d31] text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" style={{ color: 'var(--color-accent, #5865f2)' }} />
                <h3 className="font-sans text-lg font-bold text-white">
                  Receipt & Feedback
                </h3>
              </div>
              <p className="mt-1 font-sans text-xs text-neutral-400">
                Leave rating or confirmation note for sender @{pkg.senderUsername}.
              </p>

              {reviewSubmitted && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-400">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>Confirmation recorded successfully!</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="mt-4 space-y-3">
                {/* Rating Stars */}
                <div>
                  <label className="block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                    Rating:
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
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono-code text-xs text-neutral-400">
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                    Your Name or Handle:
                  </label>
                  <input
                    type="text"
                    value={clientAuthor}
                    onChange={e => setClientAuthor(e.target.value)}
                    aria-label="Your Name or Handle"
                    placeholder="Anonymous Recipient"
                    className="w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs bg-[#232428] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block font-mono-code text-[10px] uppercase tracking-wider font-semibold mb-1 text-neutral-400">
                    Delivery Notes / Confirmation:
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={clientComment}
                    onChange={e => setClientComment(e.target.value)}
                    aria-label="Delivery Notes or Confirmation"
                    placeholder="Received all files intact..."
                    className="w-full rounded-xl border py-1.5 px-3 font-mono-code text-xs bg-[#232428] border-[#383a40] text-white focus:outline-none focus:border-[var(--color-accent,#5865f2)] transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase text-white hover:brightness-110 shadow-md transition-all"
                  style={{ backgroundColor: 'var(--color-accent, #5865f2)' }}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Submit Confirmation</span>
                </button>
              </form>
            </div>

            {/* Existing Feedback History */}
            <div className="rounded-2xl border p-6 border-[#383a40] bg-[#2b2d31] text-white">
              <h3 className="font-sans text-lg font-bold mb-2 text-white">
                Delivery Log ({pkg.reviews?.length || 0})
              </h3>
              {(!pkg.reviews || pkg.reviews.length === 0) ? (
                <p className="font-mono-code text-xs text-neutral-400">
                  No confirmation notes submitted yet.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {pkg.reviews.map(rev => (
                    <div key={rev.id} className="rounded-xl border p-3 border-[#383a40] bg-[#232428]">
                      <div className="flex items-center justify-between">
                        <span className="font-sans text-xs font-bold text-white">
                          {rev.author}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 font-sans text-xs italic text-neutral-300">
                        "{rev.comment}"
                      </p>
                      <span className="mt-2 block font-mono-code text-[9px] text-neutral-500">
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
