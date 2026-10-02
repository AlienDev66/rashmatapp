#!/usr/bin/env node
/**
 * Generate Apple Sign In client secret (JWT) for Supabase.
 *
 * Prerequisites (Apple Developer):
 * 1. App ID com.rashmat.app with Sign In with Apple enabled
 * 2. Services ID (e.g. com.rashmat.app.web) with Sign In with Apple configured
 *    Return URL: https://<PROJECT_REF>.supabase.co/auth/v1/callback
 * 3. Key (.p8) with Sign In with Apple enabled — download once
 *
 * Usage:
 *   APPLE_TEAM_ID=XXXX APPLE_KEY_ID=YYYY APPLE_SERVICES_ID=com.rashmat.app.web \
 *   APPLE_P8_PATH=~/Downloads/AuthKey_YYYY.p8 \
 *   node scripts/generate-apple-secret.mjs
 *
 * Paste the printed JWT into Supabase → Auth → Providers → Apple → Secret Key.
 * Client IDs (comma-separated, Services ID first):
 *   com.rashmat.app.web,com.rashmat.app
 *
 * JWT expires in ~6 months — re-run and update Supabase before expiry.
 */
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

const teamId = process.env.APPLE_TEAM_ID;
const keyId = process.env.APPLE_KEY_ID;
const servicesId = process.env.APPLE_SERVICES_ID;
const p8Path = process.env.APPLE_P8_PATH;

if (!teamId || !keyId || !servicesId || !p8Path) {
  console.error(`Missing env. Example:

APPLE_TEAM_ID=RQPVJ6XN9D \\
APPLE_KEY_ID=XXXXXXXXXX \\
APPLE_SERVICES_ID=com.rashmat.app.web \\
APPLE_P8_PATH=~/Downloads/AuthKey_XXXXXXXXXX.p8 \\
node scripts/generate-apple-secret.mjs
`);
  process.exit(1);
}

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

const now = Math.floor(Date.now() / 1000);
const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
const payload = b64url(
  JSON.stringify({
    iss: teamId,
    iat: now,
    exp: now + 86400 * 180, // ~6 months (Apple max)
    aud: "https://appleid.apple.com",
    sub: servicesId,
  }),
);

const privateKey = readFileSync(p8Path, "utf8");
const signer = createSign("SHA256");
signer.update(`${header}.${payload}`);
signer.end();
// Apple requires IEEE-P1363 (raw r||s), not DER — convert
const der = signer.sign(privateKey);
const raw = derToJose(der);
const token = `${header}.${payload}.${raw.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;

console.log("\n=== Paste into Supabase Apple → Secret Key ===\n");
console.log(token);
console.log("\n=== Client IDs (Services ID first) ===\n");
console.log(`${servicesId},com.rashmat.app\n`);

/** Convert ECDSA DER signature to JOSE raw (r||s) 64 bytes for P-256 */
function derToJose(derSig) {
  // Minimal DER parse for SEQUENCE { INTEGER r, INTEGER s }
  let offset = 0;
  if (derSig[offset++] !== 0x30) throw new Error("Invalid DER");
  const seqLen = derSig[offset++];
  void seqLen;
  if (derSig[offset++] !== 0x02) throw new Error("Invalid DER r");
  let rLen = derSig[offset++];
  let r = derSig.subarray(offset, offset + rLen);
  offset += rLen;
  if (derSig[offset++] !== 0x02) throw new Error("Invalid DER s");
  let sLen = derSig[offset++];
  let s = derSig.subarray(offset, offset + sLen);
  // Strip leading zeros / pad to 32 bytes
  const out = Buffer.alloc(64);
  r = trimInt(r);
  s = trimInt(s);
  r.copy(out, 32 - r.length);
  s.copy(out, 64 - s.length);
  return out;
}

function trimInt(buf) {
  let i = 0;
  while (i < buf.length - 1 && buf[i] === 0) i++;
  const trimmed = buf.subarray(i);
  if (trimmed.length > 32) throw new Error("Integer too large for P-256");
  return trimmed;
}
