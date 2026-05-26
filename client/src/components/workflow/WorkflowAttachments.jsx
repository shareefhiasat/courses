import { useLang } from '@contexts/LangContext';
import { getThemedIcon } from '@constants/iconTypes';
import Button from '@ui/Button/Button';
import { formatQatarDate } from '@utils/timezone';

export default function WorkflowAttachments({ file, onDownload, onPreview }) {
  const { t } = useLang();

  if (!file) return null;

  return (
    <>
      {/* Current File */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-blue-200">
        <div className="flex items-center gap-3">
          {getThemedIcon('ui', 'file', 24)}
          <div>
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">
              {file.mimeType} • {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
            <Button
              variant="outline"
              onClick={() => onPreview(file)}
              title={t('workflow.document.view', 'View')}
            >
              {getThemedIcon('ui', 'eye', 16)}
            </Button>
          )}
          <Button
            onClick={() => onDownload(file.id, file.name)}
            title={t('workflow.document.download', 'Download')}
          >
            {getThemedIcon('ui', 'download', 16)}
          </Button>
        </div>
      </div>

      {/* Version History */}
      {file.versions && file.versions.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            {t('workflow.document.versionHistory', 'Version History')}
          </p>
          <div className="space-y-4">
            {file.versions
              .sort((a, b) => b.versionNumber - a.versionNumber)
              .map((version) => (
                <div
                  key={version.id}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {version.isCurrent ? (
                        <div className="h-8 w-8 text-green-600">
                          {getThemedIcon('ui', 'check_circle', 32)}
                        </div>
                      ) : (
                        getThemedIcon('ui', 'file', 32, 'muted')
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {t('workflow.document.version', 'Version')} {version.versionNumber}
                        {version.isCurrent && (
                          <span className="ml-2 text-xs font-medium text-green-600">
                            ({t('workflow.document.current', 'Current')})
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span>
                          {formatQatarDate(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                        <span>•</span>
                        <span>{(version.size / 1024).toFixed(2)} KB</span>
                      </div>
                      {version.changeNote && (
                        <p className="text-xs text-gray-500 mt-1">{version.changeNote}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(file.id, `${file.name}_v${version.versionNumber}`)}
                        title={t('workflow.document.download', 'Download')}
                      >
                        {getThemedIcon('ui', 'download', 16)}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
