import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "./crypto";

describe("crypto utility", () => {
  const originalKey = process.env.TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = "test-secret-key-for-unit-testing";
  });

  afterEach(() => {
    process.env.TOKEN_ENCRYPTION_KEY = originalKey;
  });

  it("should encrypt and decrypt a string successfully", () => {
    const text = "hello-world-secret-123";
    const encrypted = encrypt(text);
    
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    expect(encrypted).toContain(":");
    expect(encrypted.split(":")).toHaveLength(3);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(text);
  });

  it("should throw an error when decrypting an invalid format", () => {
    expect(() => decrypt("invalidformat")).toThrow(
      "Invalid encrypted data format. Expected iv:authTag:encryptedText"
    );
    expect(() => decrypt("a:b")).toThrow(
      "Invalid encrypted data format. Expected iv:authTag:encryptedText"
    );
  });

  it("should fail decryption if the encryption key changes", () => {
    const text = "super-secret-content";
    const encrypted = encrypt(text);

    // Change key and try to decrypt
    process.env.TOKEN_ENCRYPTION_KEY = "different-secret-key-123456";
    expect(() => decrypt(encrypted)).toThrow();
  });
});
