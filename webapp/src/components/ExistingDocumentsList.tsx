import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { api } from '~/trpc/react';
import Image from 'next/image'; // Add Next.js Image component

// Component for displaying and managing uploaded documents
interface ExistingDocumentsListProps {
  documents: {
    documentID: number;
    fileName: string;
    document?: string;  // Base64 document data for preview
  }[];
  onDelete?: (documentId: number) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageClick?: (imageSrc: string) => void; // Callback for full-size image display
}

const ExistingDocumentsList: React.FC<ExistingDocumentsListProps> = ({ documents, onDelete, onUpload, onImageClick }) => {
  const utils = api.useUtils();
  // Change index signature to Record type
  const [documentImages, setDocumentImages] = useState<Record<number, string>>({});

  const deleteDocument = api.userDocuments.deleteDocument.useMutation({
    onSuccess: async () => {
      // Add await to fix floating promise
      await utils.userDocuments.getUserDocuments.invalidate();
      setDocumentImages({});
    },
  });

  useEffect(() => {
    // Change index signature to Record type
    const newImages: Record<number, string> = {};
    documents.forEach(doc => {
      if (doc.document) {
        newImages[doc.documentID] = doc.document;
      }
    });
    setDocumentImages(newImages);
  }, [documents]);

  const handleDelete = async (documentId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this document?');
    if (confirmed) {
      await deleteDocument.mutateAsync({ documentId });
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <input
            type="file"
            className="hidden"
            onChange={onUpload}
            multiple
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.bmp"
          />
          <div className="text-4xl text-gray-400 mb-2">+</div>
          <span className="text-sm text-gray-500">Upload Documents</span>
        </label>
      </div>

      {documents.map((doc) => (
        <div key={doc.documentID} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => onImageClick && documentImages[doc.documentID] ? onImageClick(`data:image/png;base64,${documentImages[doc.documentID]}`) : null}>
            {documentImages[doc.documentID] && typeof documentImages[doc.documentID] === 'string' ? (
              // Check if the image data is a base64 string and add the data URL prefix if needed
              <Image
                src={ `data:image/png;base64,${documentImages[doc.documentID]}`}
                alt={doc.fileName}
                width={300}
                height={300}
                className="w-full h-full object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400">No preview</span>
              </div>
            )}

          </div>
          <p className="mt-1 text-sm text-gray-500 truncate">{doc.fileName}</p>
          {onDelete && (
            <button
              onClick={() => handleDelete(doc.documentID)}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Delete document"
            >
              <FaTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ExistingDocumentsList;