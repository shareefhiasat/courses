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

  const getColors = (type) => {
    switch (type) {
      case 'success':
        return 'bg-[#1d4e1d] border-[#2d6a2d] text-[#a5d6a7]';
      case 'error':
        return 'bg-[#4e1d1d] border-[#6a2d2d] text-[#ffb4ab]';
      case 'warning':
        return 'bg-[#4e3d1d] border-[#6a5d2d] text-[#ffd699]';
      default:
        return 'bg-[#1d2d4e] border-[#2d3d6a] text-[#b4c5ff]';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 end-4 z-[100] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const icon = getIcon(toast.type);
        const colors = getColors(toast.type);

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${colors}`}
          >
            {getThemedIcon('ui', icon, 20, 'light')}
            <p className="flex-1 text-sm font-medium">
              {toast.message}
            </p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity"
            >
              {getThemedIcon('ui', 'x', 16, 'light')}
            </button>
          </div>
        );
      })}
    </div>
  );
}
