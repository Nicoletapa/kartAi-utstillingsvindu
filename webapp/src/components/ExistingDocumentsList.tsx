import React, { useCallback, useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { api } from '~/trpc/react';
import Image from 'next/image'; // Add Next.js Image component
import { Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';


// Component for displaying and managing uploaded documents
interface ExistingDocumentsListProps {
  documents: {
    documentID: number;
    fileName: string;
    document?: string;  // Base64 document data for preview
  }[];
  onDelete?: (documentId: number) => void;
  onUpload: (files: File[]) => void;
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
    const confirmed = window.confirm('Er du sikker på at du vil slette dette dokumentet?');
    if (confirmed) {
      await deleteDocument.mutateAsync({ documentId });
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
      'application/pdf': ['.pdf'],
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
    }, multiple: true,
    
  });

  return (
    <>
    <div {... getRootProps()} className={`h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed mb-4 transition-colors ${isDragActive ? 'bg-gray-300 border-gray-400' : 'bg-gray-100 hover:bg-gray-100'}`}>
        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
          <input
            {... getInputProps()}
            type="file"
            className="hidden"
            onChange={(e) => onUpload(Array.from(e.target.files ?? []))}
            multiple
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff,.bmp"
          />
          <span className="text-sm text-gray-500 inline-flex">
            {isDragActive ? 'Slipp filene her' : 'Dra og slipp filer eller klikk for å laste opp'}
            <Upload size={18} className="text-gray-500 ml-2" />
          </span>
        </label>
      </div>
    <div className="grid grid-cols-2 gap-4">
      {documents.length > 0 ? (
       documents.map((doc) => (
        <div key={doc.documentID} className="relative group">
          <div className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onClick={() => onImageClick && documentImages[doc.documentID] ? onImageClick(`data:image/png;base64,${documentImages[doc.documentID]}`) : null}>
            {documentImages[doc.documentID] && typeof documentImages[doc.documentID] === 'string' ? (
              // Check if the image data is a base64 string and add the data URL prefix if needed
              <Image
                src={ `data:image/png;base64,${documentImages[doc.documentID]}`}
                alt={doc.fileName}
                width={150}
                height={150}
                className="relative h-full w-full object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-400">Ingen forhåndsvisning tilgjengelig</span>
              </div>
            )}

          </div>
          <p className="mt-1 text-sm text-gray-500 truncate mb-4">{doc.fileName}</p>
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
      ))
      ) : (
        <div className="col-span-2 flex justify-center items-center h-32 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-center">Dokumenter som oppfyller<br /> valideringskravene vil vises her</p>
        </div>
      )}
    </div>
    </>
  );
};

export default ExistingDocumentsList;