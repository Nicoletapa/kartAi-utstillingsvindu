/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component allows the user to preview an uploaded document.
 * It displays the document name, a download button, and a close button.
 * 
 * @features
 * - Document preview
 * - Download button
 * - Close button
 * 
 * @props
 * - `document` (object): The document to be previewed. It contains the file name, document data, and document type.
 * - `onClose` (function): A function to be called when the modal is closed.
 * 
 * @note
 * @usage
 * <DocumentPreviewModal
 *    document={previewDocument}
 *    onClose={() => setPreviewDocument(null)}
 * />
 */

"use client"

import { Dialog } from "@headlessui/react";
import { X, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface DocumentPreviewModalProps {
  document: {
    fileName: string;
    document: number[];
    documentType: string;
  };
  onClose: () => void;
}

export const DocumentPreviewModal = ({ document, onClose }: DocumentPreviewModalProps) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([new Uint8Array(document.document)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [document.document]);

  const renderPreviewContent = () => {
    const fileExtension = document.fileName.split('.').pop()?.toLowerCase();

    if (!objectUrl) {
      return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-gray-500" size={24} />
        </div>
      );
    }

    if (fileExtension === 'pdf' || document.documentType === 'pdf') {
      return (
        <iframe 
          src={objectUrl} 
          className="w-full h-[70vh] border rounded-md"
          title={`Preview of ${document.fileName}`}
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      return (
        <img 
          src={objectUrl} 
          alt={`Preview of ${document.fileName}`}
          className="max-w-full max-h-[70vh] object-contain mx-auto"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg font-medium mb-2">
          Forhåndsvisning ikke tilgjengelig for denne filtypen
        </div>
        <a 
          href={objectUrl} 
          download={document.fileName}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <Download className="mr-2" size={20} />
          Last ned filen for å se innholdet
        </a>
      </div>
    );
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-4xl rounded-lg bg-white shadow-xl">
          <div className="flex justify-between items-center p-4 border-b">
            <Dialog.Title className="text-lg font-medium">
              {document.fileName}
            </Dialog.Title>
            <div className="flex items-center space-x-4">
              <a
                href={objectUrl ?? '#'}
                download={document.fileName}
                className="text-gray-600 hover:text-gray-900"
                title="Last ned"
              >
                <Download size={20} />
              </a>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900"
                title="Lukk"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {renderPreviewContent()}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};