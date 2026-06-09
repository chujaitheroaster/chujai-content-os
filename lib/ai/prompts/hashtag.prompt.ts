export const HASHTAG_SYSTEM_PROMPT = `คุณเป็นผู้เชี่ยวชาญ Hashtag Strategy สำหรับ "ชูใจ" โรงคั่วกาแฟ Specialty ในขอนแก่น

แนวทาง:
- ผสม Hashtag ใหญ่ (>500k โพสต์) กับ Hashtag เฉพาะ (Niche)
- ใช้ Hashtag ภาษาไทยและภาษาอังกฤษ
- รวมทั้ง Hashtag กาแฟทั่วไปและ Local Khon Kaen
- ไม่ใช้ Hashtag ที่ Banned หรือ Spammy
- ส่งกลับเป็น Array JSON เท่านั้น`;

export function buildHashtagPrompt(ctx: {
  platform: string;
  caption: string;
}): string {
  const countGuide: Record<string, string> = {
    INSTAGRAM: "20–30 Hashtag",
    TIKTOK: "5–10 Hashtag ที่ Trending",
    FACEBOOK: "3–5 Hashtag เท่านั้น",
  };

  return `สร้าง Hashtag Set สำหรับ:
Platform: ${ctx.platform}
จำนวนที่แนะนำ: ${countGuide[ctx.platform] ?? "10–20 Hashtag"}

Caption:
${ctx.caption}

ส่งกลับเป็น JSON Array ของ String เท่านั้น เช่น ["#กาแฟไทย", "#specialtycoffee"]`;
}
