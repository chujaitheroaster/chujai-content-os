"use client";

import { useState } from "react";
import type { ContentStatus } from "@prisma/client";
import type { AIReviewResult } from "@/types";

interface AiToolsPanelProps {
  contentItemId: string;
  captionDraft: string | null;
  canApprove: boolean;
  contentStatus: ContentStatus;
}

export function AiToolsPanel({ contentItemId, captionDraft, canApprove, contentStatus }: AiToolsPanelProps) {
  const [captionLoading, setCaptionLoading] = useState(false);
  const [hashtagLoading, setHashtagLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [hashtagError, setHashtagError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<AIReviewResult | null>(null);

  async function generateCaption() {
    setCaptionLoading(true);
    setCaptionError(null);
    try {
      const res = await fetch("/api/ai/caption-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setCaptionError(d.error ?? "เกิดข้อผิดพลาด");
      } else {
        window.location.reload();
      }
    } finally {
      setCaptionLoading(false);
    }
  }

  async function generateHashtags() {
    setHashtagLoading(true);
    setHashtagError(null);
    try {
      const res = await fetch("/api/ai/hashtag-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setHashtagError(d.error ?? "เกิดข้อผิดพลาด");
      } else {
        window.location.reload();
      }
    } finally {
      setHashtagLoading(false);
    }
  }

  async function reviewContent() {
    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);
    try {
      const res = await fetch("/api/ai/review-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentItemId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setReviewError(d.error ?? "เกิดข้อผิดพลาด");
      } else {
        const data = await res.json();
        setReviewResult(data);
      }
    } finally {
      setReviewLoading(false);
    }
  }

  async function approveContent() {
    await fetch(`/api/content-items/${contentItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      {/* AI Tools */}
      <div className="bg-white rounded-xl border border-stone-200 p-5">
        <h2 className="font-semibold text-stone-900 mb-4">AI Tools</h2>
        <div className="space-y-3">
          <AiButton
            label="✨ Generate Caption"
            description="สร้าง Caption ตาม Brief + Platform"
            loading={captionLoading}
            error={captionError}
            onClick={generateCaption}
          />
          <AiButton
            label="# Generate Hashtags"
            description="สร้าง Hashtag Set ที่เหมาะสม"
            loading={hashtagLoading}
            error={hashtagError}
            onClick={generateHashtags}
            disabled={!captionDraft}
            disabledReason="Generate Caption ก่อน"
          />
          <AiButton
            label="🔍 Review Content"
            description="ตรวจ Caption, CTA, Brand Voice"
            loading={reviewLoading}
            error={reviewError}
            onClick={reviewContent}
          />
        </div>
      </div>

      {/* Review Results */}
      {reviewResult && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-stone-900">ผล Review</h3>
            <span className={`text-sm font-bold ${reviewResult.overallScore >= 70 ? "text-green-600" : reviewResult.overallScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {reviewResult.overallScore}/100
            </span>
          </div>

          {reviewResult.warnings.length === 0 ? (
            <p className="text-sm text-green-600 font-medium">✅ PASS — ทุกหัวข้อผ่าน</p>
          ) : (
            <div className="space-y-2">
              {reviewResult.warnings.map((w, i) => (
                <div key={i} className={`p-3 rounded-lg border ${w.severity === "HIGH" ? "border-red-200 bg-red-50" : w.severity === "MEDIUM" ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-stone-600">{w.category}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${w.severity === "HIGH" ? "bg-red-100 text-red-700" : w.severity === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                      {w.severity}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700">{w.message}</p>
                  <p className="text-xs text-stone-500 mt-1">💡 {w.suggestion}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] text-stone-400 mt-3">⚠️ Warning เท่านั้น ไม่บล็อกการ Publish</p>
        </div>
      )}

      {/* Approve (Owner only) */}
      {canApprove && contentStatus === "IN_REVIEW" && (
        <div className="bg-white rounded-xl border border-green-200 p-5">
          <h3 className="font-semibold text-stone-900 mb-2">Owner Approval</h3>
          <p className="text-sm text-stone-500 mb-3">Content นี้รอ Approve จากคุณ</p>
          <div className="flex gap-2">
            <button
              onClick={approveContent}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              ✅ Approve
            </button>
            <button
              onClick={async () => {
                await fetch(`/api/content-items/${contentItemId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "IN_PROGRESS" }),
                });
                window.location.reload();
              }}
              className="flex-1 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              🔄 ขอแก้ไข
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AiButton({
  label,
  description,
  loading,
  error,
  onClick,
  disabled,
  disabledReason,
}: {
  label: string;
  description: string;
  loading: boolean;
  error: string | null;
  onClick: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="w-full text-left px-4 py-3 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={disabled ? disabledReason : undefined}
      >
        <p className="text-sm font-medium text-stone-900">{loading ? "กำลังประมวลผล..." : label}</p>
        <p className="text-xs text-stone-500 mt-0.5">{disabled ? disabledReason : description}</p>
      </button>
      {error && (
        <div className="mt-1.5 flex items-center gap-2">
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button onClick={onClick} className="text-xs text-stone-500 underline">Retry</button>
        </div>
      )}
    </div>
  );
}
