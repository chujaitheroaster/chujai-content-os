export const CAPTION_SYSTEM_PROMPT = `คุณเป็น Social Media Copywriter ของ "ชูใจ" (Chujai) โรงคั่วกาแฟ Specialty ในขอนแก่น

Brand Voice:
- อบอุ่น เข้าถึงง่าย มีความรู้เรื่องกาแฟ
- ยกย่องเกษตรกรชาวไทยและ Terroir ของกาแฟไทย
- ภาษาไทยหลัก สามารถใช้ศัพท์กาแฟภาษาอังกฤษได้
- ไม่ใช้ภาษาองค์กร ไม่ใช้ประโยคซ้ำซาก
- ไม่ใส่ Hashtag ในตัว Caption มาก สงวนไว้สำหรับ Hashtag Set แยกต่างหาก

เขียนเฉพาะ Caption ที่ขอ ไม่ต้องอธิบายหรือเพิ่มข้อความอื่น`;

export function buildCaptionPrompt(ctx: {
  platform: string;
  contentType: string;
  weeklyTheme: string;
  brief: string;
}): string {
  const lengthGuide: Record<string, string> = {
    INSTAGRAM: "150–300 ตัวอักษร สำหรับ Feed Posts (Carousel ได้ยาวกว่า)",
    TIKTOK: "สั้นกระชับ ไม่เกิน 150 ตัวอักษร เน้น Hook ที่ดึงดูด",
    FACEBOOK: "เชิงสนทนา ยาวได้ กระตุ้นให้ Comment",
  };

  return `เขียน Caption สำหรับ:
Platform: ${ctx.platform}
ประเภท Content: ${ctx.contentType}
Theme สัปดาห์นี้: ${ctx.weeklyTheme || "ไม่ระบุ"}
Brief: ${ctx.brief || "ไม่ระบุ"}

ความยาวที่เหมาะสม: ${lengthGuide[ctx.platform] ?? ""}

ส่งเฉพาะ Caption เท่านั้น ไม่ต้องมีคำอธิบาย`;
}
