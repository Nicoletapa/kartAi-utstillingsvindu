import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileImage, Trash2, Loader2, X } from 'lucide-react';

interface AndreVedleggProps {
    documents: any[];
    onUpload: (files: File[]) => void;
}

const AndreVedlegg: React.FC<AndreVedleggProps> = ({ onUpload }) => {
    const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string | null }[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
                <div>
                    <h1 className="text-xl font-medium">Sørg for at:</h1>
                    <ul className="text-sm list-disc ml-6 mt-2 space-y-1 text-gray-700">
                        <li>Alle tegninger er i <b>målestokk</b> og <b>målsatte</b></li>
                        <li>Plantegningene må oppgi <b>hvor store</b> rommene er og <b>hva</b> de brukes til</li>
                        <li>Fasadetegninger må vise <b>alle sider</b> av bygningen, og terrenget rundt bygningen både <b>før og etter</b> endringen</li>
                        <li>Situasjonskartet skal inneholde det du skal <b>bygge eller endre</b>, med <b>mål</b> på korteste avstand og fram til:</li>
                        <ul className="list-disc ml-6 space-y-1">
                            <li>Nærmeste bygg på egen eiendom</li>
                            <li>Nærmeste nabobygning</li>
                            <li>Nabogrense</li>
                            <li>Midten av gang-, sykkel- eller bilvei</li>
                        </ul>
                        <li>Snittegninger må vise <b>snittet</b> på bygningen både på <b>langs og på tvers</b>. Dersom boligen har flere etasjer, må <b>høyden</b> på disse oppgis</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};


export default AndreVedlegg;
