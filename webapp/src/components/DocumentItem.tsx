import React from 'react';
import { api } from "~/trpc/react";

interface DocumentItemProps {
  documentID: number;
  fileName: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ documentID, fileName }) => {
  const documentQuery = api.userDocuments.getDocumentById.useQuery(
    { documentId: documentID },
    { enabled: true }
  );

  return (
    <div className="p-3 border rounded-lg">
      <div className="font-medium">{fileName}</div>
      {documentQuery.data?.document && (
        <div className="mt-2">
          <img
            src={`data:image/*;base64,${documentQuery.data.document}`}
            alt={fileName}
            className="max-w-full h-auto rounded"
          />
        </div>
      )}
    </div>
  );
};

export default DocumentItem;