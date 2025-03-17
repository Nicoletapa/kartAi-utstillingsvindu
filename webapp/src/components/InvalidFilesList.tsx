import React from 'react';

interface InvalidFilesListProps {
  invalidFiles: { file: File; base64: string }[];
  onRemove: (index: number) => void;
}

const InvalidFilesList: React.FC<InvalidFilesListProps> = ({ invalidFiles, onRemove }) => {
  if (invalidFiles.length === 0) return null;

  return (
    <div className="mb-6 mt-4">
      <h3 className="text-lg font-semibold mb-3 text-yellow-600">Ugyldige Dokumenter</h3>
      <div className="gap-4">
        {invalidFiles.map(({ file }, index) => (
          <div key={index} className="relative group flex flex-col">
            <p className="mt-1 text-sm text-gray-500 truncate">{file.name}
              
            <button
                onClick={() => onRemove(index)}
                className="absolute z-10 inset-y-0 right-auto p-2 text-red"
                aria-label="Remove invalid document"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvalidFilesList;