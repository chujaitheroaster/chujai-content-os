"use client";

import { useState, useRef } from "react";

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|avif|mp4|mov|webm|pdf|ai|psd|fig)$/i;
const ALLOWED_DESCRIPTION = "รูป (JPG/PNG/GIF/WebP), วิดีโอ (MP4/MOV/WebM), PDF, AI, PSD, Figma";

interface UploadedFile {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSizeBytes: number | null;
}

interface FileUploaderProps {
  contentItemId?: string;
  taskId?: string;
  onUpload?: (file: UploadedFile) => void;
  existingFiles?: UploadedFile[];
}

export function FileUploader({ contentItemId, taskId, onUpload, existingFiles = [] }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_EXTENSIONS.test(file.name)) {
      setError(`ไฟล์ประเภทนี้ไม่รองรับ รองรับ: ${ALLOWED_DESCRIPTION}`);
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      setError("ไฟล์ต้องไม่เกิน 100MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const form = new FormData();
      form.append("file", file);
      if (contentItemId) form.append("contentItemId", contentItemId);
      if (taskId) form.append("taskId", taskId);

      const res = await fetch("/api/files/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload failed");
      }
      const uploaded: UploadedFile = await res.json();
      setFiles((prev) => [...prev, uploaded]);
      onUpload?.(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }

  function getIcon(fileType: string) {
    if (fileType.startsWith("image/")) return "🖼";
    if (fileType.startsWith("video/")) return "🎬";
    if (fileType === "application/pdf") return "📄";
    return "📎";
  }

  return (
    <div className="space-y-3">
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.blobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm p-2 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors group"
            >
              <span>{getIcon(f.fileType)}</span>
              <span className="flex-1 truncate text-stone-700">{f.filename}</span>
              <span className="text-xs text-stone-400">{formatSize(f.fileSizeBytes)}</span>
              <span className="text-xs text-stone-400 group-hover:text-stone-600">↗</span>
            </a>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.avif,.mp4,.mov,.webm,.pdf,.ai,.psd,.fig"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm px-3 py-2 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-stone-400 hover:text-stone-700 disabled:opacity-50 transition-colors w-full justify-center"
        >
          {uploading ? (
            <><span className="animate-spin">⏳</span> กำลังอัปโหลด...</>
          ) : (
            <><span>+</span> แนบไฟล์</>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        <p className="text-[10px] text-stone-400 mt-1">{ALLOWED_DESCRIPTION} · สูงสุด 100MB</p>
      </div>
    </div>
  );
}
