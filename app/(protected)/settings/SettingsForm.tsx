"use client";

import { useState } from "react";

export function SettingsForm({ initialWebhook }: { initialWebhook: string }) {
  const [webhook, setWebhook] = useState(initialWebhook);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lark_webhook_url: webhook }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function testWebhook() {
    if (!webhook) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ msg_type: "text", content: { text: "✅ ชูใจ Content OS — Lark ทดสอบ OK!" } }),
      });
      setTestResult(res.ok ? "✅ ส่งสำเร็จ ตรวจดูใน Lark" : "❌ ส่งไม่สำเร็จ (" + res.status + ")");
    } catch {
      setTestResult("❌ ไม่สามารถเชื่อมต่อได้");
    }
    setTesting(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-stone-700 mb-1 block">Lark Webhook URL</label>
        <input
          type="url"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          placeholder="https://open.larksuite.com/open-apis/bot/v2/hook/..."
        />
        <p className="text-xs text-stone-400 mt-1">รับ URL จาก Lark Bot → Bot Settings → Webhook</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
        >
          {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
        <button
          onClick={testWebhook}
          disabled={testing || !webhook}
          className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50 disabled:opacity-50 transition-colors"
        >
          {testing ? "กำลังทดสอบ..." : "ทดสอบ Lark"}
        </button>
        {saved && <p className="text-sm text-green-600">✅ บันทึกแล้ว</p>}
        {testResult && <p className="text-sm">{testResult}</p>}
      </div>
    </div>
  );
}
