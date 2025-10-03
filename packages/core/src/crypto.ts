export type EncryptedVault = {
  salt: string;
  iv: string;
  cipherText: string;
};

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  if (clean.length % 2 !== 0) throw new Error('Invalid hex');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  // Create an ArrayBuffer copy to satisfy DOM BufferSource typing strictly
  const buf = new ArrayBuffer(view.byteLength);
  const out = new Uint8Array(buf);
  out.set(view);
  return buf;
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: toArrayBuffer(salt), iterations: 150_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(secret: Uint8Array, password: string): Promise<EncryptedVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(secret));
  return {
    salt: toHex(salt),
    iv: toHex(iv),
    cipherText: toHex(new Uint8Array(cipherBuffer))
  };
}

export async function decryptSecret(vault: EncryptedVault, password: string): Promise<Uint8Array> {
  const salt = fromHex(vault.salt);
  const iv = fromHex(vault.iv);
  const key = await deriveKeyFromPassword(password, salt);
  const cipherBytes = fromHex(vault.cipherText);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(cipherBytes));
  return new Uint8Array(plainBuffer);
}