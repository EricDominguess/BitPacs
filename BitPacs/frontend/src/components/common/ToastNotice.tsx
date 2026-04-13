interface ToastNoticeProps {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const toneMap: Record<NonNullable<ToastNoticeProps['type']>, { border: string; iconBg: string; iconColor: string }> = {
  success: {
    border: 'border-green-500/30',
    iconBg: 'bg-green-500/15',
    iconColor: 'text-green-500',
  },
  error: {
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-500',
  },
  warning: {
    border: 'border-yellow-500/30',
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-500',
  },
  info: {
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-500',
  },
};

export function ToastNotice({ title, message, type = 'success', onClose }: ToastNoticeProps) {
  const tone = toneMap[type];

  return (
    <div className="fixed top-4 right-4 z-[120] max-w-md animate-in slide-in-from-top-2 fade-in duration-200">
      <div className={`flex items-start gap-3 rounded-xl border bg-theme-secondary shadow-xl px-4 py-3 ${tone.border}`}>
        <span className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone.iconBg} ${tone.iconColor}`}>
          {type === 'success' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-theme-primary">{title}</p>
          <p className="text-sm text-theme-muted break-words">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-md p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-tertiary transition-colors"
          title="Fechar aviso"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
