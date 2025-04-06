import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileImage, Trash2, Loader2, X, Info } from 'lucide-react';

interface AndreVedleggProps {
    documents: any[];
    onUpload: (files: File[]) => void;
    formData?: {
        andreVedlegg: string;
      };
      setFormData?: React.Dispatch<React.SetStateAction<{
        andreVedlegg: string;
        }>>;
}

const AndreVedlegg: React.FC<AndreVedleggProps> = ({   formData: externalFormData, 
    setFormData: externalSetFormData, onUpload }) => {
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [hoveredBox, setHoveredBox] = useState<string | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const [internalFormData, setInternalFormData] = useState({ andreVedlegg: "" });

    const formData = externalFormData || internalFormData;

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                setLoading(true);

                const newFiles = acceptedFiles.map((file) => ({
                    file,
                    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                }));

                setUploadedFiles((prev) => [...prev, ...newFiles]);

                setTimeout(() => {
                    setLoading(false);
                    onUpload(acceptedFiles);
                }, 2000);
            }
        },
        [onUpload]
    );

    const handleDelete = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleImageClick = (preview: string) => {
        setPreviewImage(preview);
    };

    const closePreview = () => {
        setPreviewImage(null);
    };

    const handleMouseEnter = (box: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        setHoveredBox(box);
    };

    const handleMouseLeave = () => {
        const id = setTimeout(() => setHoveredBox(null), 300);
        setTimeoutId(id);
    };

    const updateFormData = (newData: typeof formData) => {
        if (typeof externalSetFormData === 'function') {
            externalSetFormData(newData);
        } else {
            setInternalFormData(newData);
        }
    };

       const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            const updatedFormData = { ...formData, [name]: value };
            updateFormData(updatedFormData);
        };

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePreview();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
            'application/pdf': ['.pdf'],
            'application/dwg': ['.dwg'],
            'application/dxf': ['.dxf'],
        },
        multiple: true,
    });

    return (
        <div className='justify-center flex flex-col w-full'>
<div className="flex min-h-96 p-6 flex-col md:flex-row" data-cy="main-container">
            <div className="w-full md:w-2/3" data-cy="left-column">
                <div
                    {...getRootProps()}
                    className={`h-12 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed mb-4 transition-colors ${isDragActive ? 'bg-gray-300 border-gray-400' : 'bg-gray-100 hover:bg-gray-100'
                        }`}
                >
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
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
                    <div className="grid grid-cols-2 gap-4">
                        {uploadedFiles.map(({ file, preview }, index) => (
                            <div key={index} className="relative group bg-gray-100 rounded-lg p-2">
                                <button
                                    onClick={() => handleDelete(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Delete file"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {preview ? (
                                    <img
                                        src={preview}
                                        alt={file.name}
                                        className="h-20 w-20 object-cover rounded-md cursor-pointer"
                                        onClick={() => handleImageClick(preview)}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-20 w-20 bg-gray-200 rounded-md">
                                        {file.type === 'application/pdf' ? (
                                            <FileText size={24} className="text-gray-500" />
                                        ) : (
                                            <FileImage size={24} className="text-gray-500" />
                                        )}
                                        <p className="text-xs text-gray-500 mt-1 truncate w-full text-center">{file.name}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {previewImage && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity animate-fade-in"
                        onClick={closePreview}
                    >
                        <div className="relative">
                            <button
                                onClick={closePreview}
                                className="absolute top-2 right-2 bg-white text-black p-2 rounded-full"
                                aria-label="Close preview"
                            >
                                <X size={20} />
                            </button>
                            <img src={previewImage} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg" />
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

            <div className="w-full md:ml-16" data-cy="right-column">
                <p className='space-y-1'>Her finner du sammendraget over alle dine dokumenter i byggesøknaden. Hvis du mangler
                    dokumenter eller har tilleggsdokumenter, vennligst last de opp her.
                </p>
                <h1 className='font-medium mt-2'>Liste over dokumenter som du burde ha på plass:</h1>
                <ul className='list-disc ml-7 text-sm space-y-1'>
                    <li className='italic'><span className='font-medium not-italic'>Situasjonskart</span> hvor jeg har tegnet inn det jeg skal bygge/rive, og relevante avstander</li>
                    <li className='italic'><span className='font-medium not-italic'>Plantegning</span> før og etter</li>
                    <li className='italic'><span className='font-medium not-italic'>Snittegning</span> før og etter</li>
                    <li className='italic'><span className='font-medium not-italic'>Fasadetegninger</span> før og etter</li>
                    <li><span className='font-medium'>Nabovarsel</span>
                        <ul className='list-disc ml-7 space-y-1'>
                            <li>Et eksemplar av komplett nabovarsel med alle vedlegg</li>
                            <li>Dokumentasjon på at alle naboer er varslet (f.eks. kvitteringer)</li>
                            <li>Eventuelle merknader fra naboer</li>
                            <li>Dine kommentarer fra naboens merknader</li>
                        </ul>
                    </li>
                    <li><span className='font-medium'>Dispensasjon</span>  hvis aktuelt
                        <ul className='list-disc ml-7 space-y-1'>
                            <li>Søknader om dispensasjon eller innvilget dispensasjon (spesifiser i feltet under)</li>
                            <li>Uttalelser/vedtak fra annen myndighet (spesifiser i feltet under)</li>
                        </ul>
                    </li>
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
                                        className="absolute top-0 left-6 bg-white shadow-lg border rounded-lg p-3 w-64 text-sm"
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
                            value={formData?.andreVedlegg || ""}
                            onChange={handleInputChange}
                            required
                        />
            </div>
        </div>
        
    );
};


export default AndreVedlegg;
