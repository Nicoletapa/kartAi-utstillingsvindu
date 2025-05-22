/**
 * This file is used in Utstillingsvindu 2.0
 * 
 * @description
 * This component mimics CADAiD (CadadidAtlas.tsx) and is used in the building application process.
 * It allows users to upload additional documents later in the process.
 * 
 * @features
 * - Drag and drop file upload
 * - File preview for images and PDFs
 * - File deletion
 * - Text area for additional comments
 * - File type validation
 * 
 * @props
 * - `documents` (Document[]): Array of documents to display.
 * - `onUpload` (function): Callback function to handle file uploads.
 * - `formData` (object): Form data containing additional comments.
 * - `setFormData` (function): Function to update form data.
 * 
 * @note
 * - This component is designed to be used in a client-side context.
 * - The file upload functionality is implemented using the `react-dropzone` library.
 * 
 * @usage
 * <AndreVedlegg onUpload={(files) => console.log('Uploaded files:', files)} />
 */

import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileImage, Trash2, Loader2, X, Info } from 'lucide-react';
import Image from 'next/image';

type Document = {
    documentID: number;
    fileName: string;
    documentType: string;
    applicationID: number;
};

interface AndreVedleggProps {
    documents?: Document[];
    onUpload: (files: File[]) => void;
    formData?: {
        andreVedlegg: string;
    };
    setFormData?: React.Dispatch<React.SetStateAction<{
        andreVedlegg: string;
    }>>;
}

type UploadedFile = {
    file: File;
    preview: string | null;
};

const ACCEPTED_FILE_TYPES = {
    'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
    'application/pdf': ['.pdf'],
    'application/dwg': ['.dwg'],
    'application/dxf': ['.dxf'],
    'image/vnd.dwg': ['.dwg'],
    'image/vnd.dxf': ['.dxf'],
};

const DOCUMENT_CHECKLIST = [
    {
        title: "Situasjonskart",
        description: "hvor jeg har tegnet inn det jeg skal bygge/rive, og relevante avstander"
    },
    {
        title: "Plantegning",
        description: "før og etter"
    },
    {
        title: "Snittegning",
        description: "før og etter"
    },
    {
        title: "Fasadetegninger",
        description: "før og etter"
    },
    {
        title: "Nabovarsel",
        subItems: [
            "Et eksemplar av komplett nabovarsel med alle vedlegg",
            "Dokumentasjon på at alle naboer er varslet (f.eks. kvitteringer)",
            "Eventuelle merknader fra naboer",
            "Dine kommentarer fra naboens merknader"
        ]
    },
    {
        title: "Dispensasjon",
        description: "hvis aktuelt",
        subItems: [
            "Søknader om dispensasjon eller innvilget dispensasjon (spesifiser i feltet under)",
            "Uttalelser/vedtak fra annen myndighet (spesifiser i feltet under)"
        ]
    }
];

const AndreVedlegg: React.FC<AndreVedleggProps> = ({
    formData: externalFormData,
    setFormData: externalSetFormData,
    onUpload
}) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [internalFormData, setInternalFormData] = useState({ andreVedlegg: "" });
    const [openModal, setOpenModal] = useState<boolean>(false);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);

    const formData = externalFormData ?? internalFormData;

    const updateFormData = useCallback((newData: typeof formData) => {
        if (externalSetFormData) {
            externalSetFormData(newData);
        } else {
            setInternalFormData(newData);
        }
    }, [externalSetFormData]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        updateFormData({ ...formData, [name]: value });
    }, [formData, updateFormData]);

    const handleDelete = useCallback((index: number) => {
        setUploadedFiles(prev => {
            const newFiles = [...prev];
            const [removedFile] = newFiles.splice(index, 1);
            if (removedFile?.preview) {
                URL.revokeObjectURL(removedFile.preview);
            }
            return newFiles;
        });
    }, []);

    const handleImageClick = useCallback((preview: string) => {
        setPreviewImage(preview);
    }, []);

    const closePreview = useCallback(() => {
        setPreviewImage(null);
    }, []);

    const handleMouseEnter = useCallback((box: string) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        setHoveredBox(box);
    }, [timeoutId]);

    const handleMouseLeave = useCallback(() => {
        const id = setTimeout(() => setHoveredBox(null), 300);
        setTimeoutId(id);
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setLoading(true);
        const newFiles = acceptedFiles.map(file => ({
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        }));

        setUploadedFiles(prev => [...prev, ...newFiles]);

        setTimeout(() => {
            setLoading(false);
            onUpload(acceptedFiles);
        }, 2000);
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: ACCEPTED_FILE_TYPES,
        multiple: true,
    });

    useEffect(() => {
        return () => {
            uploadedFiles.forEach(file => {
                if (file.preview) {
                    URL.revokeObjectURL(file.preview);
                }
            });
        };
    }, [uploadedFiles]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePreview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closePreview]);

    const renderFilePreview = useCallback((file: File, preview: string | null) => {
        if (preview) {
            return (
                <Image
                    src={preview}
                    alt={file.name}
                    width={80}
                    height={80}
                    className="object-cover rounded-md cursor-pointer"
                    onClick={() => handleImageClick(preview)}
                    style={{ maxWidth: '100%', height: 'auto' }}
                />
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gray-200 rounded-md p-1">
                {file.type === 'application/pdf' ? (
                    <FileText size={24} className="text-gray-500" />
                ) : (
                    <FileImage size={24} className="text-gray-500" />
                )}
                <p className="text-xs text-gray-500 mt-1 break-words w-full text-center">
                    {file.name}
                </p>
            </div>
        );
    }, [handleImageClick]);

    return (
        <div>
            <h1 className="text-3xl font-bold justify-center flex mb-4">Andre vedlegg
                    <Info size={18} className="ml-2 hover:cursor-pointer" onClick={handleOpenModal} />
                  </h1>
                  {openModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={handleCloseModal}>
                      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full transform transition-all scale-95 opacity-0 animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="mb-8">
                          <h1 className="text-xl font-medium">Andre vedlegg</h1>
                          <p className="text-sm mt-2">
                            Her kan du laste opp eventuelle andre vedlegg som er relevante for søknaden din.
                            Dersom du har fått tilsendt dokumenter fra naboer angående nabovarsel, kan du laste opp disse her.
                          </p>
                        </div>
            
                        <button className="absolute mt-4 px-4 py-2 right-3 bottom-3 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                          onClick={handleCloseModal}>
                          Lukk
                        </button>
                      </div>
                    </div>
                  )}
          <div className='justify-center flex flex-col w-full'>
            <div className="flex min-h-96 p-6 flex-col md:flex-row" data-cy="main-container">
                <div className="w-full md:w-2/3" data-cy="left-column">
                    <div
                        {...getRootProps()}
                        className={`h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed mb-4 transition-colors ${
                            isDragActive ? 'bg-gray-300 border-gray-400' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                            <input {...getInputProps()} className="hidden" multiple />
                            <span className="text-sm text-gray-500 flex items-center">
                                {isDragActive ? 'Slipp filene her' : 'Dra og slipp filer eller klikk for å laste opp'}
                                <Upload size={18} className="text-gray-500 ml-2" />
                            </span>
                        </label>
                    </div>

                    {uploadedFiles.length === 0 ? (
                        <div className="col-span-2 flex justify-center items-center h-32 bg-gray-50 rounded-lg">
                            <p className="text-gray-400 text-center">Andre vedlegg vil vises her</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {uploadedFiles.map(({ file, preview }, index) => (
                                <div key={`${file.name}-${index}`} className="relative group bg-gray-100 rounded-lg p-2 aspect-square flex items-center justify-center">
                                    <button
                                        onClick={() => handleDelete(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        aria-label="Delete file"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    {renderFilePreview(file, preview)}
                                </div>
                            ))}
                        </div>
                    )}

                    {previewImage && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity animate-fade-in p-4"
                            onClick={closePreview}
                        >
                            <div className="relative w-full h-full max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={closePreview}
                                    className="absolute top-2 right-2 bg-white text-black p-2 rounded-full z-10"
                                    aria-label="Close preview"
                                >
                                    <X size={20} />
                                </button>
                                <Image
                                    src={previewImage}
                                    alt="Preview"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className="rounded-lg"
                                />
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex justify-center items-center my-2">
                            <Loader2 className="animate-spin text-gray-500" size={24} />
                            <span className="ml-2 text-gray-500 text-sm">Laster opp filer...</span>
                        </div>
                    )}
                </div>

                <div className="w-full md:ml-16 mt-6 md:mt-0" data-cy="right-column">
                    <p className='space-y-1'>
                        Her finner du sammendraget over alle dine dokumenter i byggesøknaden. Hvis du mangler
                        dokumenter eller har tilleggsdokumenter, vennligst last de opp her.
                    </p>
                    <h1 className='font-medium mt-2'>Liste over dokumenter som du burde ha på plass:</h1>
                    <ul className='list-disc ml-7 text-sm space-y-1'>
                        {DOCUMENT_CHECKLIST.map((item, index) => (
                            <li key={index} className='italic'>
                                <span className='font-medium not-italic'>{item.title}</span> {item.description}
                                {item.subItems && (
                                    <ul className='list-disc ml-7 space-y-1'>
                                        {item.subItems.map((subItem, subIndex) => (
                                            <li key={subIndex}>{subItem}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className='border-2 border-gray-400 rounded-lg p-4'>
                <h2 className="font-medium inline-flex">
                    Andre vedlegg
                    <div className="relative flex">
                        <Info
                            size={14}
                            className="ml-1 hover:cursor-pointer"
                            onMouseEnter={() => handleMouseEnter('andreVedlegg')}
                            onMouseLeave={handleMouseLeave}
                        />
                        {hoveredBox === 'andreVedlegg' && (
                            <div
                                className="absolute bottom-full left-0 mb-2 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm z-10"
                                onMouseEnter={() => handleMouseEnter('andreVedlegg')}
                                onMouseLeave={handleMouseLeave}
                            >
                                Spesifiser om du har lagt til dispensasjon eller andre relevante vedlegg.
                            </div>
                        )}
                    </div>
                </h2>
                <textarea
                    name="andreVedlegg"
                    className="w-full min-h-20 mt-2 p-4 text-md border-2 border-gray-300 rounded-lg"
                    placeholder="Skriv her ..."
                    value={formData.andreVedlegg}
                    onChange={handleInputChange}
                />
            </div>
        </div>
        </div>
    );   
};

export default AndreVedlegg;