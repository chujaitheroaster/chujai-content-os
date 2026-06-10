"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditableFieldProps {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  label?: string;
  className?: string;
}

export function InlineEditableField({
  value,
  onSave,
  placeholder = "คลิกเพื่อแก้ไข",
  multiline = false,
  label,
  className,
}: InlineEditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (inputRef.current instanceof HTMLTextAreaElement) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing]);

  async function handleSave() {
    if (draft === (value ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch {
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(value ?? "");
      setEditing(false);
    }
  }

  const displayValue = value ?? "";

  if (editing) {
    return (
      <div className={`space-y-1 ${className ?? ""}`}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500 resize-vertical"
            disabled={saving}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
            disabled={saving}
          />
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs px-3 py-1.5 bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
          <button
            onClick={() => { setDraft(value ?? ""); setEditing(false); }}
            className="text-xs px-3 py-1.5 text-stone-500 hover:text-stone-700"
          >
            ยกเลิก
          </button>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group cursor-pointer ${className ?? ""}`}
      onClick={() => setEditing(true)}
    >
      {displayValue ? (
        <p className="text-sm text-stone-700 whitespace-pre-wrap group-hover:bg-stone-50 rounded p-1 -m-1 transition-colors">
          {displayValue}
        </p>
      ) : (
        <p className="text-sm text-stone-400 italic group-hover:bg-stone-50 rounded p-1 -m-1 transition-colors">
          {placeholder}
        </p>
      )}
      <span className="text-[10px] text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity">
        ✏️ คลิกเพื่อแก้ไข
      </span>
    </div>
  );
}
