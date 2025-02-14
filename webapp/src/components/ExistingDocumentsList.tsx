import React from 'react';
import { FaTrash } from 'react-icons/fa';
import { api } from '~/trpc/react';

interface ExistingDocumentsListProps {
  documents: {
    documentID: number;
    fileName: string;
  }[];
  onDelete?: (documentId: number) => void;
}

const ExistingDocumentsList: React.FC<ExistingDocumentsListProps> = ({ documents, onDelete }) => {
  const utils = api.useContext();

  const deleteDocument = api.userDocuments.deleteDocument.useMutation({
    onSuccess: () => {
      utils.userDocuments.getUserDocuments.invalidate();
    },
  });

  const handleDelete = async (documentId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument.mutateAsync({ documentId });
      onDelete?.(documentId);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map((doc) => (
        <div key={doc.documentID} className="relative group">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {/* Document preview */}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500">{doc.fileName}</span>
            </div>
            
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
  );
};

export default ExistingDocumentsList;