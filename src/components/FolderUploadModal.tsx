// src/components/FolderUploadModal.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Folder, FileText, Image, CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';
import { FileAttachment } from '../types';
import { FileLimitExceededModal } from './FileLimitExceededModal';

interface FolderUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (attachments: FileAttachment[]) => void;
  maxSizePerFileMB?: number;
  maxFiles?: number;
}

export function FolderUploadModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  maxSizePerFileMB = 10, 
  maxFiles = 50 
}: FolderUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAttachments, setProcessedAttachments] = useState<FileAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLimitExceededModalOpen, setIsLimitExceededModalOpen] = useState(false);
  const [folderName, setFolderName] = useState('Selected Folder');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFiles([]);
      setProcessedAttachments([]);
      setError(null);
      setIsProcessing(false);
      setIsLimitExceededModalOpen(false);
      setFolderName('Selected Folder');
      fileInputRef.current?.click();
    }
  }, [isOpen]);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const firstFilePath = files[0].webkitRelativePath || files[0].name;
    const extractedFolderName = firstFilePath.split('/')[0] || 'Selected Folder';
    setFolderName(extractedFolderName);

    const validFiles = files.filter((file) => {
      if (file.name.startsWith('.') || file.name.startsWith('~')) return false;
      if (file.size > maxSizePerFileMB * 1024 * 1024) {
        setError(`File "${file.name}" exceeds ${maxSizePerFileMB}MB limit.`);
        return false;
      }
      return true;
    });

    setSelectedFiles(validFiles);
    if (validFiles.length > maxFiles) {
      setIsLimitExceededModalOpen(true);
    } else {
      processFiles(validFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    setError(null);

    try {
      const attachments: FileAttachment[] = [];

      for (const file of files) {
        const content = await fileToBase64(file);
        attachments.push({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          content,
        });
      }

      setProcessedAttachments(attachments);
    } catch (err) {
      setError('Failed to process files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleConfirm = () => {
    onConfirm(processedAttachments);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Folder</h3>
              <p className="text-sm text-gray-600">Select and process files</p>
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

        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderSelect}
            className="hidden"
          />

          {selectedFiles.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <Folder size={16} className="text-gray-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{folderName}</p>
                  <p className="text-xs text-gray-600">{selectedFiles.length} files selected</p>
                </div>
                {selectedFiles.length > maxFiles ? (
                  <AlertCircle size={16} className="text-yellow-600" />
                ) : (
                  <CheckCircle size={16} className="text-green-600" />
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirm}
                disabled={isProcessing || selectedFiles.length === 0}
                className="w-full py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin inline mr-2" />
                    Processing...
                  </>
                ) : (
                  'Process Files'
                )}
              </button>

              {processedAttachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Ready to Attach ({processedAttachments.length})</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={handleConfirm}
                      className="flex-1 py-2 px-4 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      <CheckCircle size={16} className="inline mr-2" />
                      Attach to Message
                    </button>
                    <button
                      onClick={onClose}
                      className="py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Folder size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-500 mb-4">Select a folder to upload</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Choose Folder
              </button>
            </div>
          )}
        </div>
      </div>

      <FileLimitExceededModal
        isOpen={isLimitExceededModalOpen}
        onClose={() => setIsLimitExceededModalOpen(false)}
        exceededCount={selectedFiles.length}
        maxFiles={maxFiles}
        folderName={folderName}
      />
    </div>
  );
}