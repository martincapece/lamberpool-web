'use client';

type FeedbackTone = 'success' | 'error' | 'info';

interface AdminFeedbackModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  tone?: FeedbackTone;
  onClose: () => void;
}

const toneStyles: Record<FeedbackTone, { panel: string; badge: string; label: string }> = {
  success: {
    panel: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    label: 'Operacion completada',
  },
  error: {
    panel: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Operacion con error',
  },
  info: {
    panel: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Informacion',
  },
};

export default function AdminFeedbackModal({
  isOpen,
  title,
  message,
  tone = 'info',
  onClose,
}: AdminFeedbackModalProps) {
  if (!isOpen) {
    return null;
  }

  const styles = toneStyles[tone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-md rounded-xl border bg-white shadow-xl ${styles.panel}`}>
        <div className="space-y-4 p-6">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
            {styles.label}
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-600">{message}</p>
          </div>
        </div>
        <div className="flex justify-end rounded-b-xl bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}