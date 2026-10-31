/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
// plane propel & icons
import { Button } from "@makeplane/propel/components/button";
import { UploadOutline, CloseOutline, ImageOutline } from "@makeplane/propel/icons";
// plane imports
import { ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE, MAX_FILE_SIZE } from "@plane/constants";
import { setToast } from "@plane/blocks/toast";
import type { TLogoProps } from "@plane/types";
import { EFileAssetType } from "@plane/types";
import { cn, getFileURL } from "@plane/utils";
// services
import { FileService } from "@/services/file.service";

type Props = {
  workspaceSlug: string;
  projectId?: string;
  logoProps?: TLogoProps;
  onChange: (image: { url: string; asset_id?: string }) => void;
  onRemove?: () => void;
  disabled?: boolean;
};

const fileService = new FileService();

export function ProjectLogoUploadTab({
  workspaceSlug,
  projectId = "",
  logoProps,
  onChange,
  onRemove,
  disabled = false,
}: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_AVATAR_IMAGE_MIME_TYPES_FOR_REACT_DROPZONE,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: disabled || isUploading,
    noClick: !!selectedFile,
  });

  const currentImageUrl =
    logoProps?.in_use === "image"
      ? logoProps.image?.url || (logoProps as any)?.url || (logoProps as any)?.image_url
      : undefined;

  const handleUpload = async () => {
    if (!selectedFile || !workspaceSlug) return;
    setIsUploading(true);

    try {
      const res = await fileService.uploadWorkspaceAsset(
        workspaceSlug,
        {
          entity_identifier: projectId || "",
          entity_type: EFileAssetType.PROJECT_LOGO,
        },
        selectedFile
      );

      onChange({
        url: res.asset_url,
        asset_id: res.asset_id,
      });

      setSelectedFile(null);
      setToast({
        type: "success",
        title: "Photo uploaded",
        message: "Project image updated successfully",
      });
    } catch (error: any) {
      console.error("Failed to upload project photo:", error);
      setToast({
        type: "error",
        title: "Upload failed",
        message: error?.error || error?.message || "Failed to upload project photo. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4 text-left">
      {/* Dropzone / Preview Area */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all duration-150 select-none",
          isDragActive
            ? "border-primary bg-primary/5 ring-primary/20 ring-2"
            : "cursor-pointer border-subtle bg-layer-1 hover:bg-surface-2",
          (selectedFile || isUploading) && "cursor-default",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />

        {selectedFile ? (
          // Newly selected file ready to be uploaded
          <div className="flex flex-col items-center gap-3">
            <div className="group relative">
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Selected project preview"
                className="ring-primary/30 shadow-md size-24 rounded-xl object-cover ring-2"
              />
              <button
                type="button"
                onClick={handleClearSelected}
                className="shadow-sm hover:text-danger absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-subtle bg-surface-1 text-secondary transition-colors hover:bg-surface-2"
                title="Remove selection"
              >
                <CloseOutline className="size-3.5" />
              </button>
            </div>
            <div className="flex flex-col items-center">
              <p className="max-w-[200px] truncate text-13 font-medium text-primary">{selectedFile.name}</p>
              <p className="text-11 text-secondary">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
        ) : currentImageUrl ? (
          // Current existing image with replace option
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img
                src={getFileURL(currentImageUrl) || currentImageUrl}
                alt="Current project logo"
                className="shadow-sm size-24 rounded-xl object-cover ring-2 ring-subtle"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-12 font-medium text-secondary">
                {isDragActive ? "Drop new photo to replace" : "Click or drag to replace photo"}
              </span>
              <span className="text-11 text-placeholder">PNG, JPG, WEBP, GIF up to 5MB</span>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-secondary">
              {isDragActive ? <UploadOutline className="size-6 text-primary" /> : <ImageOutline className="size-6" />}
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-13 font-medium text-primary">
                {isDragActive ? "Drop image to upload" : "Upload project photo"}
              </span>
              <span className="text-12 text-secondary">Drag and drop or click to browse</span>
            </div>
            <span className="mt-1 text-11 text-placeholder">PNG, JPG, WEBP, GIF up to 5MB</span>
          </div>
        )}
      </div>

      {/* Validation error */}
      {fileRejections.length > 0 && (
        <p className="text-center text-12 text-danger-primary">
          {fileRejections[0].errors[0]?.code === "file-too-large"
            ? "The photo cannot exceed 5 MB."
            : "Please choose a valid image file (PNG, JPG, WEBP, GIF)."}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-subtle pt-1">
        {onRemove && currentImageUrl && !selectedFile ? (
          <Button
            variant="danger"
            size="sm"
            stretch="auto"
            label="Remove photo"
            onClick={onRemove}
            disabled={disabled || isUploading}
          />
        ) : selectedFile ? (
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label="Cancel"
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
          />
        ) : (
          <div />
        )}

        {selectedFile ? (
          <Button
            variant="primary"
            size="sm"
            stretch="auto"
            label={isUploading ? "Uploading..." : "Upload & Apply"}
            onClick={handleUpload}
            loading={isUploading}
            disabled={disabled}
          />
        ) : currentImageUrl ? (
          <Button
            variant="secondary"
            size="sm"
            stretch="auto"
            label="Choose another"
            onClick={open}
            disabled={disabled || isUploading}
          />
        ) : null}
      </div>
    </div>
  );
}
