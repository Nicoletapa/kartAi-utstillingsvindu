import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { requiredDrawingTypes, capitalize } from '../utils/helpers';
import type { Detection } from '~/types/detection';

interface ExistingDocument {
  documentID: number;
  fileName: string;
  document: Buffer;
  applicationID: number | null;
  userID: string;
  modelID : number;
  createdAt?: Date; 
  modelName?: {        
    name: string;
  };
  drawing_type? : string| string[];
}

interface ResultsProps {
  results: Detection[];
  existingDocuments?: ExistingDocument[];
}

const Results: React.FC<ResultsProps> = ({ results, existingDocuments = [] }) => {
  // Combine all documents into a single array
  const allDocuments = [...existingDocuments, ...results];

  // Create a summary of all drawing types found
  const drawingTypeSummary = requiredDrawingTypes.map(requiredType => {
    const foundInDocuments = allDocuments.filter(doc => {
      
      const types = 'drawing_type' in doc
        ? Array.isArray(doc.drawing_type)
          ? doc.drawing_type
          : [doc.drawing_type]
        : [];
      return types.includes(requiredType);
    });

    return {
      type: requiredType,
      found: foundInDocuments.length > 0,
      documents: foundInDocuments.map(doc => 
        'fileName' in doc ? doc.fileName : doc.file_name
      ),
    };
  });

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Validation Summary</h2>
      
      {allDocuments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Drawing Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Found In Documents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {drawingTypeSummary.map(({ type, found, documents }) => (
                <tr key={type}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {capitalize(type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      {found ? (
                        <FaCheckCircle className="text-green-500 mr-2" />
                      ) : (
                        <FaTimesCircle className="text-red-500 mr-2" />
                      )}
                      {found ? 'Found' : 'Missing'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {found ? documents.join(', ') : 'Not found in any document'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 italic">
          No documents analyzed yet. Upload a document to see results.
        </div>
      )}
    </div>
  );
};

export default Results;