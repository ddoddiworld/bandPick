const PIN_HASH_PREFIX = "pbkdf2_sha256";

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
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

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const expected = decodeBase64(expectedText);
  const actual = new Uint8Array(await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: decodeBase64(saltText),
      iterations,
    },
    key,
    expected.byteLength * 8,
  ));

  if (actual.byteLength !== expected.byteLength) return false;

  let difference = 0;
  for (let index = 0; index < actual.byteLength; index += 1) {
    difference |= actual[index] ^ expected[index];
  }
  return difference === 0;
}
