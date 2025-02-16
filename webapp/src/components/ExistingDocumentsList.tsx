import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { api } from '~/trpc/react';



interface ExistingDocumentsListProps {
  documents: {
    documentID: number;
    fileName: string;
    document?: string;  // Add this to accept base64 document data
  }[];
  onDelete?: (documentId: number) => void;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
}

const ExistingDocumentsList: React.FC<ExistingDocumentsListProps> = ({ documents, onDelete, onUpload }) => {
  const utils = api.useContext();
  const [documentImages, setDocumentImages] = useState<{ [key: number]: string }>({});

  const deleteDocument = api.userDocuments.deleteDocument.useMutation({
    onSuccess: () => {
      utils.userDocuments.getUserDocuments.invalidate();
      setDocumentImages({});
    },
  });

  // Update useEffect to only process documents that have base64 data
  useEffect(() => {
    const newImages = documents.reduce((acc, doc) => {
      if (doc.document) {
        acc[doc.documentID] = `data:image/jpeg;base64,${doc.document}`;
      }
      return acc;
    }, {} as { [key: number]: string });

    setDocumentImages(newImages);
  }, [documents]);

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await deleteDocument.mutateAsync({ documentId });
        onDelete?.(documentId);
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Upload button */}
      <div className="mb-4">
        <label className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-blue-500">
          <input
            type="file"
            className="hidden"
            onChange={onUpload}
            accept="image/*"
            multiple
          />
          <span className="text-gray-600">Click to upload new documents</span>
        </label>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <div key={doc.documentID} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {documentImages[doc.documentID] ? (
                <img
                  src={documentImages[doc.documentID]}
                  alt={doc.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-500">{doc.fileName}</span>
                </div>
              )}
              
              {/* Delete button overlay */}
              <button
                onClick={() => handleDelete(doc.documentID)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete document"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingDocumentsList;