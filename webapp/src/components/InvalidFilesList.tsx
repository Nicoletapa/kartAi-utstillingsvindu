import React from 'react';

interface InvalidFilesListProps {
  invalidFiles: { file: File; base64: string }[];
  onRemove: (index: number) => void;
}

const InvalidFilesList: React.FC<InvalidFilesListProps> = ({ invalidFiles, onRemove }) => {
  if (invalidFiles.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-yellow-600">Invalid Documents</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {invalidFiles.map(({ file, base64 }, index) => (
          <div key={index} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={base64}
                alt={file.name}
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center text-center p-2">
                <span className="text-red-600 font-medium bg-white/80 p-1 rounded">
                  No valid drawing types detected
                </span>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="absolute z-10 top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove invalid document"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500 truncate">{file.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvalidFilesList;