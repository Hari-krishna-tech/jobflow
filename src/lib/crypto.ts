import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes is standard for GCM

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is not set");
  }
  // Hash the secret to ensure we get a 32-byte key (256 bits) for aes-256-gcm
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a string using aes-256-gcm.
 * Returns a colon-separated string in the format: iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an encrypted string that was formatted by `encrypt`.
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format. Expected iv:authTag:encryptedText");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
