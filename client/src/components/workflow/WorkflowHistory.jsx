import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import { formatQatarDate } from '@utils/timezone';

export default function WorkflowHistory({ statusHistory }) {
  const { t } = useLang();

  if (!statusHistory || statusHistory.length === 0) return null;

  return (
    <div className="space-y-3">
      {statusHistory
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((history) => (
          <div key={history.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              {getThemedIcon('ui', 'user', 12)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-900 text-sm">
                  {history.actor?.name || history.actor?.firstName || '-'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatQatarDate(new Date(history.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <p className="text-xs text-gray-600">
                {history.fromStatus ? (
                  <span className="line-through text-gray-400">{history.fromStatus}</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}{' '}
                →{' '}
                <span className="font-medium text-gray-900">{history.toStatus}</span>
              </p>
              {history.reason && (
                <p className="text-xs text-gray-500 mt-1">{history.reason}</p>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
