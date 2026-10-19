const PIN_HASH_PREFIX = "pbkdf2_sha256";
const PIN_HASH_ITERATIONS = 210_000;

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array): string {
  return btoa(String.fromCharCode(...value));
}

async function derivePinBits(
  pin: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
  byteLength: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    byteLength * 8,
  ));
}

export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePinBits(pin, salt, PIN_HASH_ITERATIONS, 32);
  return [PIN_HASH_PREFIX, PIN_HASH_ITERATIONS, encodeBase64(salt), encodeBase64(hash)].join("$");
}

export async function verifyPin(pin: string, encodedHash: string): Promise<boolean> {
  const [prefix, iterationText, saltText, expectedText] = encodedHash.split("$");
  const iterations = Number(iterationText);

  if (
    prefix !== PIN_HASH_PREFIX
    || !Number.isSafeInteger(iterations)
    || iterations < 100_000
    || !saltText
    || !expectedText
  ) {
    return false;
  }

  const expected = decodeBase64(expectedText);
  const actual = await derivePinBits(pin, decodeBase64(saltText), iterations, expected.byteLength);

  if (actual.byteLength !== expected.byteLength) return false;

  let difference = 0;
  for (let index = 0; index < actual.byteLength; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}
