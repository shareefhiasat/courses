import { Clock, User, FileText } from 'lucide-react';
import { useLang } from '@contexts/LangContext';

/**
 * WorkflowHistory Component
 * Displays workflow state changes history as a list
 */
export default function WorkflowHistory({ history = [], onClose }) {
  const { t } = useLang();

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-500">{t('drive.noWorkflowHistory')}</p>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {history.map((entry, index) => (
        <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">{entry.user}</span>
              <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.toStatus)}`}>
                {entry.toStatus}
              </span>
              {entry.fromStatus && (
                <>
                  <span className="text-xs text-gray-400">from</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(entry.fromStatus)}`}>
                    {entry.fromStatus}
                  </span>
                </>
              )}
            </div>
            {entry.comment && (
              <div className="flex items-start gap-2 mt-2">
                <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-600">{entry.comment}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
