// src/components/FileLimitExceededModal.tsx
import { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface FileLimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  exceededCount: number;
  maxFiles: number;
  folderName?: string;
}

export function FileLimitExceededModal({ 
  isOpen, 
  onClose, 
  exceededCount, 
  maxFiles,
  folderName = 'selected folder'
}: FileLimitExceededModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">File Limit Exceeded</h3>
              <p className="text-sm text-gray-600">Warning for "{folderName}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Folder size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-gray-700">
                The folder "{folderName}" contains <strong>{exceededCount} files</strong>, but the maximum allowed is <strong>{maxFiles}</strong>.
              </p>
              <p className="text-xs text-gray-600 mt-1">
                This will create a large upload that may take time to process. Proceed with caution or select a smaller folder.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-yellow-100 border border-yellow-200 rounded-lg hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
          >
            Proceed Anyway
          </button>
        </div>
      </div>
    </div>
  );
}