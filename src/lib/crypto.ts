// A simple client-side encryption utility using the Web Crypto API.
// NOTE: This is for obfuscation and is not a substitute for proper
// server-side secret management. The key is stored in the client-side code.

const ENCRYPTION_KEY = 'super-secret-key-for-raginfo-app';
const SALT = 'some-random-salt';

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(data: string): Promise<string> {
  try {
    const key = await getKey();
    const enc = new TextEncoder();
    const encoded = enc.encode(data);
    // The IV should be unique for each encryption operation.
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoded
    );

    // Combine IV and ciphertext for storage.
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as a base64 string.
    return btoa(String.fromCharCode.apply(null, Array.from(combined)));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to returning the original data if encryption fails.
    return data;
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  if (!encryptedData) return '';
  try {
    const key = await getKey();
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((char) => char.charCodeAt(0))
    );

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (error) {
    // If decryption fails, it might be unencrypted data from a previous session.
    return encryptedData;
  }
}
