"use client";

import { useState } from "react";
import { InlineEditableField } from "./InlineEditableField";
import { FileUploader } from "@/components/shared/FileUploader";

interface FileItem {
  id: string;
  filename: string;
  blobUrl: string;
  fileType: string;
  fileSizeBytes: number | null;
}

interface EditableContentSectionProps {
  contentItemId: string;
  brief: string | null;
  postGoal: string | null;
  captionDraft: string | null;
  hashtagsDraft: string | null;
  files: FileItem[];
}

export function EditableContentSection({
  contentItemId,
  brief,
  postGoal,
  captionDraft,
  hashtagsDraft,
  files,
}: EditableContentSectionProps) {
  async function patchContent(field: string, value: string) {
    const res = await fetch(`/api/content-items/${contentItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (!res.ok) throw new Error("Update failed");
  }

  return (
    <>
      {/* Content Brief */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-3">Content Brief</h2>
        <InlineEditableField
          value={brief}
          onSave={(v) => patchContent("brief", v)}
          placeholder="เพิ่ม Brief..."
          multiline
        />
        {postGoal !== undefined && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <p className="text-xs text-stone-500 mb-1">เป้าหมายโพสต์นี้</p>
            <InlineEditableField
              value={postGoal}
              onSave={(v) => patchContent("postGoal", v)}
              placeholder="เพิ่มเป้าหมาย..."
            />
          </div>
        )}
      </div>

      {/* Caption & Hashtags */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4">
        <h2 className="font-semibold text-stone-900">Caption & Hashtags</h2>
        <div>
          <p className="text-xs text-stone-500 mb-2">Caption Draft</p>
          <InlineEditableField
            value={captionDraft}
            onSave={(v) => patchContent("captionDraft", v)}
            placeholder="ยังไม่มี Caption — ใช้ AI Tool ด้านขวา หรือคลิกเพื่อพิมพ์เอง"
            multiline
            className="bg-stone-50 rounded-lg p-3 min-h-[80px]"
          />
        </div>
        <div>
          <p className="text-xs text-stone-500 mb-2">Hashtags (คั่นด้วยเว้นวรรค)</p>
          <InlineEditableField
            value={hashtagsDraft}
            onSave={(v) => patchContent("hashtagsDraft", v)}
            placeholder="#hashtag1 #hashtag2 ..."
          />
          {hashtagsDraft && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {hashtagsDraft.split(" ").filter(Boolean).map((tag) => (
                <span key={tag} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Attachments */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-3">ไฟล์แนบ</h2>
        <FileUploader
          contentItemId={contentItemId}
          existingFiles={files}
        />
      </div>
    </>
  );
}
