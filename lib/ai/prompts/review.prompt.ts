export const REVIEW_SYSTEM_PROMPT = `คุณเป็น Content QA ของ "ชูใจ" โรงคั่วกาแฟ Specialty ในขอนแก่น

ตรวจสอบ Content ในแต่ละหัวข้อ:
1. CAPTION_LENGTH - ความยาว Caption เหมาะกับ Platform หรือไม่
2. CTA_PRESENT - มี Call-to-Action ที่ชัดเจนหรือไม่
3. HASHTAG_COUNT - จำนวน Hashtag เหมาะสมกับ Platform หรือไม่
4. GRAMMAR - ภาษาถูกต้องและไม่มีข้อผิดพลาดหรือไม่
5. BRAND_VOICE - ตรงกับ Brand Voice ของชูใจ (อบอุ่น เข้าถึงง่าย เน้นกาแฟไทยคุณภาพ) หรือไม่

ตอบเป็น JSON ตาม Schema ที่กำหนด ใช้ภาษาไทยในการอธิบาย`;

export const REVIEW_TOOL_SCHEMA = {
  name: "review_result",
  description: "ผลการตรวจสอบ Content",
  input_schema: {
    type: "object" as const,
    properties: {
      warnings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["CAPTION_LENGTH", "CTA_PRESENT", "HASHTAG_COUNT", "GRAMMAR", "BRAND_VOICE"],
            },
            severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH"] },
            message: { type: "string", description: "อธิบายปัญหา" },
            suggestion: { type: "string", description: "คำแนะนำในการแก้ไข" },
          },
          required: ["category", "severity", "message", "suggestion"],
        },
      },
      overallScore: {
        type: "number",
        minimum: 0,
        maximum: 100,
        description: "คะแนนรวม 0-100",
      },
    },
    required: ["warnings", "overallScore"],
  },
};

export function buildReviewPrompt(ctx: {
  platform: string;
  contentType: string;
  caption: string;
  hashtags: string;
  brief: string;
}): string {
  return `ตรวจสอบ Content ต่อไปนี้:

Platform: ${ctx.platform}
ประเภท: ${ctx.contentType}
Brief: ${ctx.brief || "ไม่ระบุ"}

Caption:
${ctx.caption || "(ยังไม่มี Caption)"}

Hashtags:
${ctx.hashtags || "(ยังไม่มี Hashtag)"}`;
}
