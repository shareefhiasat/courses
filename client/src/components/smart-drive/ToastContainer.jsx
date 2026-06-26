import { getThemedIcon } from '@constants/iconTypes';

/**
 * ToastContainer - Renders toast notifications
 * Types: success, error, info, warning
 */
export default function ToastContainer({ toasts, onDismiss }) {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'x_circle';
      case 'warning': return 'alert_triangle';
      default: return 'info';
    }
  };

  const getTypeVars = (type) => {
    switch (type) {
      case 'success':
        return { bg: 'var(--color-success-light)', color: 'var(--color-success)' };
      case 'error':
        return { bg: 'var(--color-danger-light)', color: 'var(--color-danger)' };
      case 'warning':
        return { bg: 'var(--color-warning-light)', color: 'var(--color-warning)' };
      default:
        return { bg: 'var(--color-info-light)', color: 'var(--color-info)' };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 end-4 z-[1100] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const icon = getIcon(toast.type);
        const typeVars = getTypeVars(toast.type);

        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 rounded-xl border shadow-lg"
            style={{
              background: 'var(--panel)',
              borderColor: 'var(--border)',
            }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: typeVars.bg, color: typeVars.color }}
            >
              {getThemedIcon('ui', icon, 18, 'currentColor')}
            </div>
            <p className="flex-1 text-sm font-medium" style={{ color: 'var(--text)' }}>
              {toast.message}
            </p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-1 rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--panel-hover)]"
            >
              {getThemedIcon('ui', 'x', 16, 'currentColor')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
