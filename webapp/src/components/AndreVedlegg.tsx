/**
 * This file is used in Utstillingsvindu 2.0
 */

import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, FileImage, Trash2, Loader2, X } from "lucide-react";
import Image from "next/image";
import { tooltipInfo } from "~/utils/tooltipInfo";
import { Tooltip, useTooltip } from "./ui/ui-components";
import {
  ACCEPTED_FILE_TYPES,
  DOCUMENT_CHECKLIST,
} from "~/utils/andre-vedlegg-config";

interface AndreVedleggProps {
  applicationID: number;
  onUpload: (files: File[]) => void;
  formData?: {
    andreVedlegg: string;
  };
  setFormData?: React.Dispatch<
    React.SetStateAction<{
      andreVedlegg: string;
    }>
  >;
}

type UploadedFile = {
  file: File;
  preview: string | null;
};

const AndreVedlegg: React.FC<AndreVedleggProps> = ({
  formData: externalFormData,
  setFormData: externalSetFormData,
  onUpload,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [internalFormData, setInternalFormData] = useState({
    andreVedlegg: "",
  });
  const tooltip = useTooltip();

  const formData = externalFormData ?? internalFormData;

  const updateFormData = useCallback(
    (newData: typeof formData) => {
      if (externalSetFormData) {
        externalSetFormData(newData);
      } else {
        setInternalFormData(newData);
      }
    },
    [externalSetFormData],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormData({ ...formData, [name]: value });
    },
    [formData, updateFormData],
  );

  const handleDelete = useCallback((index: number) => {
    setUploadedFiles((prev) => {
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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setLoading(true);

      const newFiles = acceptedFiles.map((file) => ({
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      setTimeout(() => {
        setLoading(false);
        onUpload(acceptedFiles);
      }, 2000);
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadedFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closePreview]);

  const renderFilePreview = useCallback(
    (file: File, preview: string | null) => {
      if (preview) {
        return (
          <Image
            src={preview}
            alt={file.name}
            width={80}
            height={80}
            className="cursor-pointer rounded-md object-cover"
            onClick={() => handleImageClick(preview)}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        );
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-md bg-gray-200 p-1">
          {file.type === "application/pdf" ? (
            <FileText size={24} className="text-gray-500" />
          ) : (
            <FileImage size={24} className="text-gray-500" />
          )}
          <p className="mt-1 w-full break-words text-center text-xs text-gray-500">
            {file.name}
          </p>
        </div>
      );
    },
    [handleImageClick],
  );

  return (
    <div>
      <div className="flex justify-center">
        <h1 className="mb-4 text-3xl font-bold">Andre vedlegg</h1>
        <Tooltip
          id="conflictWithSurroundings"
          content={tooltipInfo.conflictWithSurroundings}
          isVisible={tooltip.isVisible("conflictWithSurroundings")}
          onMouseEnter={tooltip.handleMouseEnter}
          onMouseLeave={tooltip.handleMouseLeave}
        />
      </div>

      <div className="flex w-full flex-col justify-center">
        <div
          className="flex min-h-96 flex-col p-6 md:flex-row"
          data-cy="main-container"
        >
          <div className="w-full md:w-2/3" data-cy="left-column">
            <div
              {...getRootProps()}
              className={`mb-4 flex h-12 items-center justify-center rounded-lg border-2 border-dashed bg-gray-100 transition-colors ${
                isDragActive
                  ? "border-gray-400 bg-gray-300"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center">
                <input {...getInputProps()} className="hidden" multiple />
                <span className="flex items-center text-sm text-gray-500">
                  {isDragActive
                    ? "Slipp filene her"
                    : "Dra og slipp filer eller klikk for å laste opp"}
                  <Upload size={18} className="ml-2 text-gray-500" />
                </span>
              </label>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="col-span-2 flex h-32 items-center justify-center rounded-lg bg-gray-50">
                <p className="text-center text-gray-400">
                  Andre vedlegg vil vises her
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {uploadedFiles.map(({ file, preview }, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="group relative flex aspect-square items-center justify-center rounded-lg bg-gray-100 p-2"
                  >
                    <button
                      onClick={() => handleDelete(index)}
                      className="absolute right-1 top-1 z-10 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
                className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity"
                onClick={closePreview}
              >
                <div
                  className="relative h-full max-h-[90vh] w-full max-w-[90vw]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={closePreview}
                    className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 text-black"
                    aria-label="Close preview"
                  >
                    <X size={20} />
                  </button>
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    style={{ objectFit: "contain" }}
                    className="rounded-lg"
                  />
                </div>
              </div>
            )}

            {loading && (
              <div className="my-2 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-500" size={24} />
                <span className="ml-2 text-sm text-gray-500">
                  Laster opp filer...
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 w-full md:ml-16 md:mt-0" data-cy="right-column">
            <p className="space-y-1">
              Her finner du sammendraget over alle dine dokumenter i
              byggesøknaden. Hvis du mangler dokumenter eller har
              tilleggsdokumenter, vennligst last de opp her.
            </p>
            <h1 className="mt-2 font-medium">
              Liste over dokumenter som du burde ha på plass:
            </h1>
            <ul className="ml-7 list-disc space-y-1 text-sm">
              {DOCUMENT_CHECKLIST.map((item, index) => (
                <li key={index} className="italic">
                  <span className="font-medium not-italic">{item.title}</span>{" "}
                  {item.description}
                  {item.subItems && (
                    <ul className="ml-7 list-disc space-y-1">
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

        <div className="rounded-lg border-2 border-gray-400 p-4">
          <Tooltip
            title="Andre Vedlegg"
            id="conflictWithSurroundings"
            content={tooltipInfo.conflictWithSurroundings}
            isVisible={tooltip.isVisible("conflictWithSurroundings")}
            onMouseEnter={tooltip.handleMouseEnter}
            onMouseLeave={tooltip.handleMouseLeave}
          />
          <textarea
            name="andreVedlegg"
            className="text-md mt-2 min-h-20 w-full rounded-lg border-2 border-gray-300 p-4"
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
