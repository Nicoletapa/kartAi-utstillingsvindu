/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component is used in CadaidAtlas to display a summary of the validation results.¨
 * It shows the required drawing types and their status (found/missing) in the uploaded documents.
 * The component also provides a list of documents where each drawing type was found.
 * The results are displayed in a table format with icons indicating the status.
 * 
 * @features
 * - Displays a summary of required drawing types and their status
 * - Lists documents where each drawing type was found
 * - Uses icons to indicate status (found/missing)
 * - Handles both existing documents and newly uploaded results
 * 
 * @props
 * - `results` (Detection[]): Array of detection results to be displayed.
 * - `existingDocuments` (ExistingDocument[]): Array of existing documents to be displayed.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses the `requiredDrawingTypes` utility to determine the required drawing types.
 * - The `capitalize` utility is used to format the drawing type names.
 * 
 * @usage
 * <Results
 *    results={state.results} 
 *    existingDocuments={documentsQuery.data ?? []}
 * />
 */

import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { requiredDrawingTypes, capitalize } from '../utils/helpers';
import type { Detection } from '~/types/detection';

interface ExistingDocument {
  documentID: number;
  fileName: string;
  applicationID: number | null;
  userID: string;
  createdAt?: Date; 
  modelName?: {        
    name: string;
  };
  drawing_type?: string | string[];
}

interface ResultsProps {
  results: Detection[];       
  existingDocuments?: ExistingDocument[]; 
}

const Results: React.FC<ResultsProps> = ({ results, existingDocuments = [] }) => {
  const allDocuments = [...existingDocuments, ...results];

  const drawingTypeSummary = requiredDrawingTypes.map(requiredType => {
    const foundInDocuments = allDocuments.filter(doc => {
      const types = 'drawing_type' in doc
        ? Array.isArray(doc.drawing_type)
          ? doc.drawing_type
          : [doc.drawing_type]
        : [];
      return types.includes(requiredType);
    });

    const uniqueDocuments = [...new Set(foundInDocuments.map(doc => 
      'fileName' in doc ? doc.fileName : doc.file_name
    ))];

    return {
      type: requiredType,
      found: uniqueDocuments.length > 0,
      documents: uniqueDocuments,
    };
  });

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Valideringssammendrag</h2>
      
      {allDocuments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nødvendig tegningstype
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Funnet i dokument(er)
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
                      {found ? 'Funnet' : 'Mangler'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {found ? documents.join(', ') : 'Ikke funnet i dokumenter'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-gray-500 italic">
          Ingen dokumenter er lastet opp. Last opp et dokument for å se sammendraget.
        </div>
      )}
    </div>
  );
};

export default Results;