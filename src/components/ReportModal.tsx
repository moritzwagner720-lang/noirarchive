import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Send,
  Lock,
} from 'lucide-react';

interface ReportModalProps {
  packageId: string | null;
  packageTitle?: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  packageId,
  packageTitle,
  onClose,
}) => {
  const { reportPackageAction } = useApp();

  const [reason, setReason] = useState<'malware' | 'copyright' | 'inappropriate' | 'mature' | 'other'>('malware');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!packageId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await reportPackageAction(packageId, reason, details);
      if (res.success) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setError(res.error || 'Failed to submit report.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with trust & safety service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border p-6 bg-[#2b2d31] border-[#383a40] text-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl border border-[#383a40] text-neutral-400 hover:bg-[#313338] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <span className="font-mono-code text-[11px] font-bold uppercase tracking-wider text-rose-400">
              TRUST & SAFETY REPORT
            </span>
          </div>
          <h2 className="mt-2 font-sans text-xl font-bold text-white">
            Report Publication
          </h2>
          <p className="mt-1 text-xs text-neutral-400">
            Reporting <strong className="text-white font-mono-code">{packageId}</strong> ({packageTitle || 'Public bundle'}). Reports are reviewed promptly to keep the community safe.
          </p>
        </div>

        {submitted ? (
          <div className="py-8 text-center animate-in fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Report Submitted</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Thank you for keeping Noir Archive safe. Our trust & safety team has logged this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-2 text-neutral-300">
                Reason for report:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'malware', label: 'Suspicious code, malware, or virus risk' },
                  { id: 'copyright', label: 'Copyright infringement / unlicensed distribution' },
                  { id: 'inappropriate', label: 'Abusive, harassing, or illegal content' },
                  { id: 'mature', label: 'Unmarked adult or mature content' },
                  { id: 'other', label: 'Other violation' },
                ].map(r => (
                  <label
                    key={r.id}
                    onClick={() => setReason(r.id as any)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                      reason === r.id
                        ? 'border-rose-500/60 bg-rose-500/10 text-white font-semibold'
                        : 'border-[#383a40] bg-[#1e1f22] text-neutral-300 hover:border-neutral-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id as any)}
                      className="accent-rose-500"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider font-mono-code mb-1 text-neutral-300">
                Additional Details (Optional):
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Explain the specific issue with these files..."
                className="w-full rounded-xl border py-2 px-3 text-xs bg-[#1e1f22] border-[#383a40] text-white focus:outline-none focus:border-rose-500 resize-none transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:bg-[#313338]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
