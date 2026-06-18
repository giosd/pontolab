"use client";

import { useRef } from "react";

import { Button } from "@/components/ui/Button";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  selectedFileName?: string;
}

export function FileUploader({
  onFileSelected,
  disabled,
  selectedFileName,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (file) {
            onFileSelected(file);
          }
        }}
      />

      <Button
        type="button"
        variant="primary"
        disabled={disabled}
        className="bg-[#4EA8DE] hover:bg-[#3d96cc]"
        onClick={() => inputRef.current?.click()}
      >
        Selecionar Arquivo
      </Button>

      {selectedFileName ? (
        <p className="text-sm text-[#1E5F7A]">
          Arquivo selecionado:{" "}
          <span className="font-medium">{selectedFileName}</span>
        </p>
      ) : (
        <p className="text-sm text-[#38A8D8]">
          Formatos aceitos: CSV, XLSX e XLS
        </p>
      )}
    </div>
  );
}
