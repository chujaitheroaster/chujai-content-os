import { createHmac } from "crypto";

export function verifyLarkSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string
): boolean {
  const token = process.env.LARK_VERIFICATION_TOKEN;
  if (!token) return false;

  const toSign = `${timestamp}\n${nonce}\n${token}\n${body}`;
  const expected = createHmac("sha256", token).update(toSign).digest("hex");
  return expected === signature;
}
